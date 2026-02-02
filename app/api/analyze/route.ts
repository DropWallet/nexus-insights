import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { loadContextBank } from '@/lib/context'

const THEME_NAMES = [
  'Uncategorised',
  'Mod installation',
  'Mod upload',
  'Mod Browsing',
  'Community',
  'Nexus premium',
  'Mod collections',
]

export type AnalyzeBody = {
  text: string
  sourceUrl?: string
  sourceType?: 'reddit' | 'discord' | 'interview' | 'slack' | 'other'
}

export type ExtractedInsight = {
  content: string
  suggested_theme: string
  suggested_tags: string[]
}

const MAX_TAGS_PER_INSIGHT = 3

function buildSystemPrompt(contextBank: string, existingTagNames: string[]): string {
  const tagList = existingTagNames.length
    ? `Existing tags (prefer these when they fit): ${existingTagNames.join(', ')}. If there are no relevant tags, you may create a new one—but try to fit to an existing tag if possible.`
    : 'No existing tags yet. Use short, lowercase tag names (e.g. "ui", "error message"). You may create new tags as needed; try to reuse where it makes sense.'

  return `You are a Product Research Assistant for Nexus Mods. Your goal is to analyze user feedback and extract atomic insights.

Theme categories (assign each insight to exactly one):
${THEME_NAMES.filter((n) => n !== 'Uncategorised').map((n) => `- ${n}`).join('\n')}

${tagList}

Extraction & density rules:
- Atomic quality: Every insight must be a standalone nugget of information. If a sentence contains two distinct pain points (or sentiments), split them into two insights.
- Volume: Do not feel obligated to reach a specific number. For a short comment, 1 insight is often enough. For long-form text (interviews, articles), extract as many as necessary to represent every unique sentiment expressed. If in doubt, less is more—quality over quantity.
- Avoid redundancy: If the user repeats the same complaint multiple times, capture it once as a single, strong insight.
- "So what?" filter: Only extract insights that are actionable for a Product Team. Ignore generic praise (e.g. "I love this site") unless it specifies what they love (e.g. "I love the new search filters").
- Contextual accuracy: Use the Context Bank below to distinguish technical tiers (e.g. Premium vs Supporter) and tool-specific terminology (e.g. "Deployment" in Vortex vs "Installation" in Wabbajack). Reference it for Nexus/modding terms (Vortex, Collections, ESP, load order, etc.).

Other rules:
- Assign the single most relevant theme to each insight.
- Tags: Assign at least one tag (and at most ${MAX_TAGS_PER_INSIGHT}) to every insight. Every insight should have at least one tag that helps categorise it. Maximum ${MAX_TAGS_PER_INSIGHT} tags per insight. If there are no relevant tags, you may create a new one—but try to fit to an existing tag if possible. Reuse the same tag for multiple insights when it fits.
- Output only valid JSON: an array of objects with keys "content", "suggested_theme", "suggested_tags". No markdown, no explanation.

Context bank:
${contextBank || '(No context files loaded.)'}

Output format (JSON only):
[{"content":"...","suggested_theme":"Mod installation","suggested_tags":["tag1","tag2"]},...]`
}

function parseInsightsJson(raw: string): ExtractedInsight[] {
  let text = raw.trim()
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) text = codeBlock[1].trim()
  return JSON.parse(text) as ExtractedInsight[]
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as AnalyzeBody
    const { text, sourceUrl, sourceType } = body
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Request body must include "text" (string)' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const [contextBank, themesRes, tagsRes] = await Promise.all([
      loadContextBank(),
      supabase.from('themes').select('id, name').order('order_index'),
      supabase.from('tags').select('id, name'),
    ])

    if (themesRes.error) {
      return NextResponse.json(
        { error: 'Failed to load themes', details: themesRes.error.message },
        { status: 500 }
      )
    }
    const themes = themesRes.data
    const uncategorised = themes.find((t) => t.name === 'Uncategorised')
    if (!uncategorised) {
      return NextResponse.json(
        { error: 'Uncategorised theme not found in database' },
        { status: 500 }
      )
    }

    const existingTagNames = (tagsRes.data ?? []).map((t) => t.name)
    const systemPrompt = buildSystemPrompt(contextBank, existingTagNames)

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this user feedback and extract insights as JSON:\n\n${text}`,
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No text in Claude response' },
        { status: 500 }
      )
    }

    let extracted: ExtractedInsight[]
    try {
      extracted = parseInsightsJson(textBlock.text)
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse Claude response as JSON', raw: textBlock.text.slice(0, 500) },
        { status: 500 }
      )
    }

    if (!Array.isArray(extracted) || extracted.length === 0) {
      return NextResponse.json({ count: 0, insightIds: [] })
    }

    // Post-process: max 2 tags per insight, normalise (lowercase, trim)
    const normaliseTag = (t: string) => String(t).trim().toLowerCase()
    extracted = extracted.map((item) => ({
      ...item,
      suggested_tags: [...new Set((item.suggested_tags ?? []).map(normaliseTag).filter(Boolean))].slice(
        0,
        MAX_TAGS_PER_INSIGHT
      ),
    }))

    const themeByName = new Map(themes.map((t) => [t.name, t.id]))
    const tagByName = new Map((tagsRes.data ?? []).map((t) => [t.name, t.id]))
    const insertedIds: string[] = []

    for (const item of extracted) {
      const suggestedThemeId = themeByName.get(item.suggested_theme) ?? null
      const { data: insight, error: insightError } = await supabase
        .from('insights')
        .insert({
          content: item.content.slice(0, 2000),
          source_url: sourceUrl ?? null,
          source_type: sourceType ?? null,
          theme_id: uncategorised.id,
          suggested_theme_id: suggestedThemeId,
        })
        .select('id')
        .single()

      if (insightError || !insight) {
        console.error('Insert insight error', insightError)
        continue
      }
      insertedIds.push(insight.id)

      const tagNames = [...new Set((item.suggested_tags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))]
      for (const name of tagNames) {
        let tagId = tagByName.get(name)
        if (!tagId) {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({ name, color_code: '#6b7280' })
            .select('id')
            .single()
          if (!tagError && newTag) {
            tagId = newTag.id
            tagByName.set(name, tagId)
          }
        }
        if (tagId) {
          await supabase.from('insight_tags').upsert(
            { insight_id: insight.id, tag_id: tagId },
            { onConflict: 'insight_id,tag_id' }
          )
        }
      }
    }

    return NextResponse.json({ count: insertedIds.length, insightIds: insertedIds })
  } catch (err) {
    console.error('Analyze API error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
