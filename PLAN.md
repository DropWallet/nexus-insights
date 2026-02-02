# Nexus Insights — Implementation Plan

Internal tool to log, synthesise, and group qualitative user feedback from multiple sources (interviews, Reddit, Discord, Slack, etc.) using a Kanban-style board, LLM extraction, and tag-based filtering.

---

## Product principle

**From pasted text to insight cards on the board in under 10 seconds of manual effort.**

---

## Core data architecture

| Entity | Description |
|--------|-------------|
| **Themes (Buckets)** | Top-level columns on the board: Mod installation, Mod upload, Mod Browsing, Community, Nexus premium, Mod collections. Plus **Uncategorised** (Inbox) for new LLM-suggested insights. |
| **Tags** | Granular labels (e.g. UI-Labels, Error Message, Slow Speed). Many-to-many with insights. A tag can appear on insights in any theme. |
| **Insights** | Atomic feedback nuggets: content, source URL, source type, theme_id. Tags applied; user can add/remove from the board. |

**Uncategorised column:** New insights from the LLM land here with tags already applied. User reviews and drags cards into theme columns to “accept” placement.

---

## Phases

### Phase 0: Foundation ✅ (current)

- **0.1 Project + DB**
  - Next.js (App Router), TypeScript, Tailwind.
  - Frontend: Nexus design system from NexusBoilerplate (semantic tokens, ThemeProvider, Button, Typography).
  - Supabase: PostgreSQL tables `themes`, `tags`, `insights`, `insight_tags`. `insights` has `source_type` (reddit \| discord \| interview \| other) and `source_url`.
  - Seed: 6 themes + 1 “Uncategorised” theme with `order_index`.
- **0.2 Access**
  - Anonymous + access-code “space” (table `access_codes` or equivalent). Defer full wiring until Phase 2+.
- **0.3 Context bank (MVP)**
  - Folder `/context` with Markdown files (Confluence exports or hand-written). No vector DB: at analysis time, inject relevant snippets (or full context) into the Claude prompt.

**Outcome:** App runs with DS; DB schema and seed data in place; context folder ready for prompt injection.

---

### Phase 1: Ingestion → insights ✅

- **1.1** Ingestion UI: `/ingest` — textarea + source URL + optional source type. “Analyze” button.
- **1.2** API route: read context from `/context`, build system prompt (themes + existing tags + “prefer existing tags; only suggest new if no fit”). Call Claude; expect JSON array `{ content, suggested_theme, suggested_tags[] }`.
- **1.3** Persist: insert insights (theme_id = Uncategorised, suggested_theme_id for badge), create/link tags, insert `insight_tags`.
- **1.4** Simple list: `/insights` — server-rendered list of all insights with theme and tags.

**Setup:** Run `supabase/migrations/002_suggested_theme.sql` in Supabase. Set `ANTHROPIC_API_KEY` in `.env.local` for the Analyze API.

**Outcome:** Paste text → Analyze → insights appear in DB (Uncategorised), with suggested theme and tags. View on /insights.

---

### Phase 2: The board ✅

- **2.1** Board layout: `/board` — 7 columns (Uncategorised + 6 themes), horizontal scroll. Fetch themes + insights (with tags, suggested_theme name).
- **2.2** Drag-and-drop: cards between columns via @hello-pangea/dnd; on drop, PATCH `/api/insights/[id]` with `theme_id`; clear `suggested_theme_id` when moved to suggested column.
- **2.3** Tag filter bar: multi-select tags at top; filter insights across all columns (show only cards that have all selected tags).
- **2.4** Card actions: click card → popover to add/remove tags; persist via Supabase client (`insight_tags` insert/delete).

**Outcome:** Full loop: ingest → review in Uncategorised → drag to theme → filter by tags → edit tags on cards.

---

### Phase 3: Data vis + polish

- **3.1** Tag frequency view: bar chart (e.g. Recharts) of tag counts; optional filter by theme.
- **3.2** (Optional) Manage themes/tags: CRUD for buckets and tag library.
- **3.3** Access code gate: enforce code entry before accessing app (if not done earlier).

**Outcome:** Priority themes visible; optional admin for structure; access controlled.

---

## Deferred past MVP

- Full RAG (vector store over Confluence); use prompt injection only for MVP.
- “Trend” view (tag spike in last 7 days).
- LLM-generated “synthesis” insights from all input.
- Edit insight content (rely on delete + re-ingest or add later).
- Fancy per-source icons (simple icon by `source_type` is enough for MVP).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind v4, Nexus DS (NexusBoilerplate: globals.css @theme, ThemeProvider, Button, Typography) |
| Database / Auth | Supabase (PostgreSQL, anonymous + access code) |
| LLM | Claude (Anthropic API) |
| Data fetching | TanStack Query (Phase 2+) |
| Drag-and-drop | @hello-pangea/dnd (Phase 2) |
| Charts | Recharts (Phase 3) |

---

## Build order (summary)

1. Supabase schema + seed themes (and optional seed tags).
2. Context folder + “read and pass into prompt” in API (Phase 1).
3. Analyze API route (paste → Claude → JSON → DB).
4. Ingestion UI (textarea, URL, Analyze).
5. Board: columns + cards + drag theme.
6. Tag filter bar.
7. Card popover: add/remove tags.
8. Tag frequency chart.
9. Access code gate.

---

## Reference

- **NexusBoilerplate** (sibling folder): Tailwind v4 theme, semantic tokens, ThemeProvider, Button, Typography. Use as reference for front-end setup; copy theme/DS into this project.
