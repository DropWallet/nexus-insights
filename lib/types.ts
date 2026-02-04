export type Theme = {
  id: string
  name: string
  order_index: number
}

export type Tag = {
  id: string
  name: string
  color_code: string | null
}

export type InsightTagRow = {
  tag_id: string
  tags: Tag
}

export type Insight = {
  id: string
  content: string
  source_url: string | null
  source_type: string | null
  theme_id: string
  suggested_theme_id: string | null
  created_at: string
  themes: { name: string } | null
  suggested_theme: { name: string } | null
  insight_tags: InsightTagRow[]
  mod_author_url: string | null
  mod_author_name: string | null
  mod_author_avatar_url: string | null
}
