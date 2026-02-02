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

function buildSystemPrompt(contextBank: string, existingTagNames: string[]): string {
  const tagList = existingTagNames.length
    ? `Existing tags (prefer these; only suggest a new tag if none fit): ${existingTagNames.join(', ')}`
    : 'No existing tags yet. Suggest 2–4 short, lowercase tag names per insight (e.g. "ui", "error message", "slow speed").'

  return `You are a Product Research Assistant for Nexus Mods. Your goal is to analyze user feedback and extract atomic insights.

Theme categories (assign each insight to exactly one):
${THEME_NAMES.filter((n) => n !== 'Uncategorised').map((n) => `- ${n}`).join('\n')}

${tagList}

Rules:
- Extract 1–4 distinct insights from the text. Each insight = one concise sentence.
- Assign the single most relevant theme to each insight.
- Use the context bank below for Nexus/modding terminology (Vortex, Collections, ESP, load order, etc.).
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
