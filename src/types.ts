export type TechRadarCategory =
  | 'ai_breakthroughs'
  | 'big_tech'
  | 'products'
  | 'funding'
  | 'articles'
  | 'marketing'
  | 'self_storage'

export interface TechRadarItem {
  title: string
  summary?: string
  url: string
  source: string
  published_at?: string | null
}

export interface TechRadarSection {
  key: TechRadarCategory
  label: string
  items: TechRadarItem[]
}

export interface TechRadarDigest {
  id: string
  digest_date: string
  headline: string
  sections: TechRadarSection[]
  sources_count: number
  generated_by: 'ai' | 'raw'
  created_at: string
}
