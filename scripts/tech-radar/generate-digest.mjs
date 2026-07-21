// Fetches tech/AI/marketing news from curated RSS feeds + Hacker News,
// curates it into an Arabic daily digest (via Claude when available,
// otherwise a plain grouped fallback), and publishes it to Supabase.
//
// Usage: node generate-digest.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional env: ANTHROPIC_API_KEY, CLAUDE_MODEL (default claude-haiku-4-5-20251001), LOOKBACK_HOURS (default 36)

import Parser from 'rss-parser'
import { RSS_SOURCES, HACKER_NEWS_API } from './sources.mjs'

const LOOKBACK_HOURS = Number(process.env.LOOKBACK_HOURS || 36)
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001'
const CATEGORIES = ['ai_breakthroughs', 'big_tech', 'products', 'funding', 'articles', 'marketing']
const CATEGORY_LABELS = {
  ai_breakthroughs: 'أبرز تطورات الذكاء الاصطناعي',
  big_tech: 'تحركات الشركات الكبرى',
  products: 'منتجات وإطلاقات جديدة',
  funding: 'تمويل واستحواذ',
  articles: 'مقالات تستحق القراءة',
  marketing: 'تسويق ونمو',
}

const parser = new Parser({ timeout: 15000 })

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function cleanText(text) {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300)
}

function withinLookback(dateStr) {
  if (!dateStr) return true // keep undated items rather than silently dropping them
  const t = new Date(dateStr).getTime()
  if (Number.isNaN(t)) return true
  return Date.now() - t <= LOOKBACK_HOURS * 3600 * 1000
}

async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.url)
    return (feed.items || [])
      .filter((item) => item.link && withinLookback(item.isoDate || item.pubDate))
      .slice(0, 10)
      .map((item) => ({
        title: cleanText(item.title),
        url: item.link,
        source: source.name,
        snippet: cleanText(item.contentSnippet || item.content || ''),
        publishedAt: item.isoDate || item.pubDate || null,
        hint: source.hint,
      }))
  } catch (err) {
    console.warn(`[skip] ${source.name}: ${err.message}`)
    return []
  }
}

async function fetchHackerNews() {
  try {
    const res = await fetchWithTimeout(`${HACKER_NEWS_API}/topstories.json`, {}, 10000)
    const ids = (await res.json()).slice(0, 40)
    const stories = await Promise.allSettled(
      ids.map((id) => fetchWithTimeout(`${HACKER_NEWS_API}/item/${id}.json`, {}, 10000).then((r) => r.json()))
    )
    return stories
      .filter((r) => r.status === 'fulfilled' && r.value?.url && r.value.type === 'story')
      .map((r) => r.value)
      .filter((item) => withinLookback(new Date(item.time * 1000).toISOString()))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 15)
      .map((item) => ({
        title: cleanText(item.title),
        url: item.url,
        source: 'Hacker News',
        snippet: `${item.score || 0} نقطة على Hacker News`,
        publishedAt: new Date(item.time * 1000).toISOString(),
        hint: 'articles',
      }))
  } catch (err) {
    console.warn(`[skip] Hacker News: ${err.message}`)
    return []
  }
}

async function collectItems() {
  const feedResults = await Promise.all(RSS_SOURCES.map(fetchFeed))
  const hnItems = await fetchHackerNews()
  const all = [...feedResults.flat(), ...hnItems]

  const seen = new Set()
  const deduped = all.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })

  deduped.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
  return { items: deduped.slice(0, 130), sourcesCount: RSS_SOURCES.length + 1 }
}

function fallbackCurate(items) {
  const sections = CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    items: items
      .filter((i) => i.hint === key)
      .slice(0, 6)
      .map((i) => ({ title: i.title, summary: i.snippet, url: i.url, source: i.source, published_at: i.publishedAt })),
  }))
  return { headline: '', sections, generated_by: 'raw' }
}

function extractJson(text) {
  // Claude sometimes wraps JSON in a ```json fence (occasionally without a
  // closing fence if the response gets cut off), so strip fence markers
  // from either end rather than requiring a matched pair.
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
  return JSON.parse(stripped)
}

async function curateWithAI(items) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const listing = items
    .map((i, idx) => `${idx + 1}. [${i.source}] ${i.title} — ${i.snippet} (${i.url})`)
    .join('\n')

  const system = `أنت محرر نشرة تقنية يومية لمهندس برمجيات وصاحب شركة تقنية. مهمتك اختيار أهم الأخبار من قائمة خام وتنظيمها في نشرة عربية موجزة ومفيدة، تشمل: أهم تطورات الذكاء الاصطناعي، تحركات الشركات الكبرى (OpenAI, Google, Microsoft, Meta, Apple, Amazon, Anthropic...), منتجات وإطلاقات جديدة، تمويل واستحواذ، مقالات تستحق القراءة، وأخبار التسويق والنمو. اختر فقط الأخبار المهمة والحقيقية الموجودة في القائمة، لا تختلق أخبارًا. اكتب بالعربية الفصحى المبسطة مع إبقاء أسماء الشركات والمنتجات بالإنجليزية.`

  const user = `القائمة الخام (عنوان — مصدر — رابط):\n${listing}\n\nأخرج JSON بالشكل التالي فقط، بدون أي نص أو markdown خارج الـ JSON:\n{\n  "headline": "ملخص عام قصير (2-3 جمل) لأهم ما حدث اليوم",\n  "sections": [\n    { "key": "ai_breakthroughs|big_tech|products|funding|articles|marketing", "items": [ { "title": "عنوان مختصر", "summary": "جملة واحدة توضح لماذا هذا الخبر مهم", "url": "الرابط كما هو من القائمة", "source": "اسم المصدر" } ] }\n  ]\n}\nاختر ٣ إلى ٨ عناصر لكل قسم ذي صلة فقط، واحذف الأقسام الفارغة.`

  try {
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        system,
        messages: [{ role: 'user', content: user }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    }, 45000)
    if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`)
    const json = await res.json()
    const text = json.content?.[0]?.text || ''
    const parsed = extractJson(text)
    if (!Array.isArray(parsed.sections)) throw new Error('malformed sections')

    const validUrls = new Set(items.map((i) => i.url))
    const sections = parsed.sections
      .filter((s) => CATEGORIES.includes(s.key))
      .map((s) => ({
        key: s.key,
        label: CATEGORY_LABELS[s.key],
        items: (s.items || []).filter((it) => it.url && validUrls.has(it.url)),
      }))
      .filter((s) => s.items.length > 0)

    return { headline: parsed.headline || '', sections, generated_by: 'ai' }
  } catch (err) {
    console.warn(`[ai-curation-failed] falling back to raw grouping: ${err.message}`)
    return null
  }
}

async function publishToSupabase(digest) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/tech_radar_digests?on_conflict=digest_date`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([digest]),
  })
  if (!res.ok) throw new Error(`Supabase publish failed ${res.status}: ${await res.text()}`)
  return res.json()
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing publish credentials: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  console.log(`[tech-radar] collecting items (lookback ${LOOKBACK_HOURS}h)...`)
  const { items, sourcesCount } = await collectItems()
  console.log(`[tech-radar] collected ${items.length} unique items from ${sourcesCount} sources`)

  if (items.length === 0) {
    console.log('[tech-radar] no items collected — skipping publish')
    return
  }

  const curated = (await curateWithAI(items)) || fallbackCurate(items)
  const sections = curated.sections.filter((s) => s.items.length > 0)
  const digest = {
    digest_date: new Date().toISOString().slice(0, 10),
    headline: curated.headline || '',
    sections,
    sources_count: sourcesCount,
    generated_by: curated.generated_by,
  }

  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0)
  console.log(`[tech-radar] curated ${totalItems} items across ${sections.length} sections (${digest.generated_by})`)

  await publishToSupabase(digest)

  console.log(`[tech-radar] published digest for ${digest.digest_date}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[tech-radar] fatal:', err)
    process.exit(1)
  })
