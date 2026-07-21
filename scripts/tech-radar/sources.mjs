// Curated RSS sources for the daily Tech & AI Radar digest.
// `hint` nudges the AI curator toward a category but the model makes the final call
// per-item since a single feed (e.g. TechCrunch) spans multiple categories.

export const RSS_SOURCES = [
  // ── AI ──────────────────────────────────────────────────────────────────
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', hint: 'ai_breakthroughs' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', hint: 'ai_breakthroughs' },
  { name: 'Microsoft AI Blog', url: 'https://blogs.microsoft.com/ai/feed/', hint: 'ai_breakthroughs' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/tag/artificial-intelligence/feed/', hint: 'ai_breakthroughs' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', hint: 'ai_breakthroughs' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', hint: 'ai_breakthroughs' },

  // ── General Tech / Big Companies ───────────────────────────────────────
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', hint: 'big_tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', hint: 'big_tech' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', hint: 'articles' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', hint: 'articles' },

  // ── Products / Launches ────────────────────────────────────────────────
  { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', hint: 'products' },

  // ── Marketing / Growth ─────────────────────────────────────────────────
  { name: 'HubSpot Marketing', url: 'https://blog.hubspot.com/marketing/rss.xml', hint: 'marketing' },
  { name: 'Search Engine Land', url: 'https://searchengineland.com/feed', hint: 'marketing' },
  { name: 'Social Media Today', url: 'https://www.socialmediatoday.com/rss.xml', hint: 'marketing' },
  { name: 'Marketing Dive', url: 'https://www.marketingdive.com/feeds/news/', hint: 'marketing' },
]

export const HACKER_NEWS_API = 'https://hacker-news.firebaseio.com/v0'
