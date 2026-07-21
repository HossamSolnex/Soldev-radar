import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { getBookmarks, isBookmarked, toggleBookmark } from '@/lib/bookmarks'
import {
  Rss, Sparkles, Building2, Rocket, Coins, Newspaper, Megaphone,
  Bookmark, BookmarkCheck, ExternalLink, ChevronRight, ChevronLeft, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { TechRadarDigest, TechRadarItem, TechRadarCategory } from '@/types'

const CATEGORY_META: Record<TechRadarCategory, { label: string; icon: typeof Sparkles; color: string }> = {
  ai_breakthroughs: { label: 'أبرز تطورات الذكاء الاصطناعي', icon: Sparkles, color: 'text-accent bg-accent/10' },
  big_tech: { label: 'تحركات الشركات الكبرى', icon: Building2, color: 'text-blue-400 bg-blue-400/10' },
  products: { label: 'منتجات وإطلاقات جديدة', icon: Rocket, color: 'text-emerald-400 bg-emerald-400/10' },
  funding: { label: 'تمويل واستحواذ', icon: Coins, color: 'text-yellow-400 bg-yellow-400/10' },
  articles: { label: 'مقالات تستحق القراءة', icon: Newspaper, color: 'text-purple-400 bg-purple-400/10' },
  marketing: { label: 'تسويق ونمو', icon: Megaphone, color: 'text-rose-400 bg-rose-400/10' },
}

function ItemRow({ item, onToggle, saved }: { item: TechRadarItem; onToggle: (item: TechRadarItem) => void; saved: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors group">
      <div className="flex-1 min-w-0">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-text-primary text-sm font-medium hover:text-accent transition-colors flex items-center gap-1.5">
          {item.title}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
        </a>
        {item.summary && <p className="text-text-secondary text-xs mt-1 leading-relaxed">{item.summary}</p>}
        <span className="text-text-muted text-xs mt-1 inline-block">{item.source}</span>
      </div>
      <button
        onClick={() => onToggle(item)}
        className="flex-shrink-0 text-text-muted hover:text-accent transition-colors"
        title={saved ? 'إزالة من المحفوظات' : 'حفظ'}
      >
        {saved ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function App() {
  const [digests, setDigests] = useState<TechRadarDigest[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookmarkVersion, setBookmarkVersion] = useState(0)
  const [showBookmarks, setShowBookmarks] = useState(false)

  const fetchDigests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tech_radar_digests')
      .select('*')
      .order('digest_date', { ascending: false })
      .limit(30)
    if (error) console.error(error)
    setDigests((data as TechRadarDigest[]) || [])
    setActiveIndex(0)
    setLoading(false)
  }

  useEffect(() => {
    fetchDigests()
  }, [])

  const digest = digests[activeIndex]
  const bookmarks = useMemo(() => getBookmarks(), [bookmarkVersion])

  const handleToggle = (item: TechRadarItem) => {
    const nowSaved = toggleBookmark(item)
    setBookmarkVersion((v) => v + 1)
    toast.success(nowSaved ? 'تم الحفظ' : 'تمت الإزالة من المحفوظات')
  }

  const totalItems = digest?.sections.reduce((s, sec) => s + sec.items.length, 0) ?? 0

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Rss className="w-5 h-5 text-accent" />
            رادار التقنية والذكاء الاصطناعي
          </h1>
          <p className="text-text-secondary text-sm">
            نشرة يومية بالعربية لأهم أخبار التقنية والـ AI والتسويق وتحركات الشركات الكبرى
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBookmarks((v) => !v)}
            className={`btn-ghost flex items-center gap-2 ${showBookmarks ? 'text-accent' : ''}`}
          >
            <Bookmark className="w-4 h-4" />
            المحفوظات ({bookmarks.length})
          </button>
          <button onClick={fetchDigests} className="btn-ghost flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {showBookmarks ? (
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <div className="card text-center py-16">
              <Bookmark className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
              <p className="text-text-primary font-medium">لا توجد عناصر محفوظة بعد</p>
              <p className="text-text-muted text-sm mt-1">اضغط على أيقونة الحفظ بجانب أي خبر لإضافته هنا (يُحفظ محليًا في متصفحك)</p>
            </div>
          ) : (
            bookmarks.map((item) => (
              <ItemRow key={item.url} item={item} onToggle={handleToggle} saved={true} />
            ))
          )}
        </div>
      ) : loading ? (
        <div className="card animate-pulse h-64" />
      ) : !digest ? (
        <div className="card text-center py-16">
          <Rss className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
          <p className="text-text-primary font-medium mb-1">لا توجد نشرات بعد</p>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            يتم توليد نشرة جديدة تلقائيًا كل يوم عبر مهمة مجدولة على GitHub Actions.
            راجع <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded">docs/SETUP.md</code> لتشغيلها يدويًا أول مرة.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between card !py-3">
            <button
              disabled={activeIndex >= digests.length - 1}
              onClick={() => setActiveIndex((i) => Math.min(i + 1, digests.length - 1))}
              className="btn-ghost !px-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="أقدم"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-text-primary font-semibold text-sm">{formatDate(digest.digest_date)}</p>
              <p className="text-text-muted text-xs">{totalItems} خبر من {digest.sources_count} مصدر</p>
            </div>
            <button
              disabled={activeIndex <= 0}
              onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
              className="btn-ghost !px-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="أحدث"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {digest.headline && (
            <div className="bg-gradient-to-l from-accent/15 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-5">
              <p className="text-text-primary leading-relaxed">{digest.headline}</p>
            </div>
          )}

          <div className="space-y-5">
            {digest.sections.filter((s) => s.items.length > 0).map((section) => {
              const meta = CATEGORY_META[section.key] ?? { label: section.label, icon: Newspaper, color: 'text-text-secondary bg-bg-secondary' }
              const Icon = meta.icon
              return (
                <div key={section.key} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="section-title mb-0">{meta.label}</h2>
                    <span className="mr-auto text-xs px-2 py-0.5 rounded-full bg-bg-hover text-text-muted">{section.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <ItemRow key={item.url} item={item} onToggle={handleToggle} saved={isBookmarked(item.url)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
