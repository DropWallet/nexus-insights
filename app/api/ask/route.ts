import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { loadContextBank } from '@/lib/context'
import { extractKeywords } from '@/lib/search'
import type { Insight } from '@/lib/types'

const INSIGHTS_SELECT = `
  id,
  content,
  source_url,
  source_type,
  theme_id,
  suggested_theme_id,
  created_at,
  mod_author_url,
  mod_author_name,
  mod_author_avatar_url,
  themes!insights_theme_id_fkey( name ),
  suggested_theme:themes!insights_suggested_theme_id_fkey( name ),
  insight_tags ( tag_id, tags ( id, name, color_code ) )
`

const ASK_LIMIT = 75

/** Escape % and _ for use in ILIKE pattern (literal, not wildcard). */
function escapeIlike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function buildInsightsMarkdown(insights: Insight[]): string {
  return insights
    .map((i) => {
      const themeName = i.themes?.name ?? 'Unknown'
      const tagNames = (i.insight_tags ?? [])
        .map((it) => it.tags?.name)
        .filter(Boolean)
        .join(', ')
      return `## Insight (${themeName})\n${i.content}\n${tagNames ? `Tags: ${tagNames}` : ''}\n`
    })
    .join('\n')
}

function buildSystemPrompt(contextBank: string, insightsMd: string): string {
  return `You are an insights analyst for Nexus Mods. Answer the user's question using ONLY the insights below. Use the Context Bank for Nexus/modding terminology where relevant.

Context bank (terminology):
${contextBank || '(No context files loaded.)'}

---

CONTEXT (filtered insights):
${insightsMd || '(No insights match the question yet.)'}

---

If the insights above do not contain enough information to answer the question, say so clearly. Cite specific insights when relevant (e.g. "Several insights mention...").`
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

    const body = await request.json().catch(() => ({}))
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    if (!question) {
      return NextResponse.json(
        { error: 'Request body must include "question" (string)' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const keywords = extractKeywords(question)

    let query = supabase.from('insights').select(INSIGHTS_SELECT)
    if (keywords.length > 0) {
      const orClause = keywords
        .map((k) => `content.ilike.%${escapeIlike(k)}%`)
        .join(',')
      query = query.or(orClause)
    }
    const { data: insightsData, error: insightsError } = await query
      .order('created_at', { ascending: false })
      .limit(ASK_LIMIT)

    if (insightsError) {
      return NextResponse.json(
        { error: 'Failed to load insights', details: insightsError.message },
        { status: 500 }
      )
    }

    const insights = (insightsData ?? []) as unknown as Insight[]
    const insightsMd = buildInsightsMarkdown(insights)
    const contextBank = await loadContextBank()
    const systemPrompt = buildSystemPrompt(contextBank, insightsMd)

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: question,
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

    return NextResponse.json({
      answer: textBlock.text,
      sources: insights,
    })
  } catch (err) {
    console.error('Ask API error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ask failed' },
      { status: 500 }
    )
  }
}
