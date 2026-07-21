import type { TechRadarItem } from '@/types'

const STORAGE_KEY = 'soldev-radar:bookmarks'

type BookmarkMap = Record<string, TechRadarItem>

function readAll(): BookmarkMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BookmarkMap) : {}
  } catch {
    return {}
  }
}

function writeAll(map: BookmarkMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getBookmarks(): TechRadarItem[] {
  return Object.values(readAll())
}

export function isBookmarked(url: string): boolean {
  return url in readAll()
}

export function toggleBookmark(item: TechRadarItem): boolean {
  const all = readAll()
  if (item.url in all) {
    delete all[item.url]
    writeAll(all)
    return false
  }
  all[item.url] = item
  writeAll(all)
  return true
}
