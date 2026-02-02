-- Nexus Insights: themes (board columns), tags, insights, insight_tags
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Themes: high-level buckets (board columns). order_index controls column order.
CREATE TABLE themes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tags: granular labels. Many-to-many with insights.
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  color_code text DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now()
);

-- Insights: atomic feedback nuggets. theme_id = which column the card lives in.
CREATE TABLE insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  source_url text,
  source_type text CHECK (source_type IN ('reddit', 'discord', 'interview', 'slack', 'other')),
  theme_id uuid NOT NULL REFERENCES themes(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now()
);

-- Many-to-many: which tags are on which insights
CREATE TABLE insight_tags (
  insight_id uuid NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (insight_id, tag_id)
);

-- Indexes for common queries
CREATE INDEX idx_insights_theme_id ON insights(theme_id);
CREATE INDEX idx_insights_created_at ON insights(created_at);
CREATE INDEX idx_insight_tags_insight_id ON insight_tags(insight_id);
CREATE INDEX idx_insight_tags_tag_id ON insight_tags(tag_id);

-- Seed themes: Uncategorised (Inbox) first, then the 6 product themes
INSERT INTO themes (name, order_index) VALUES
  ('Uncategorised', 0),
  ('Mod installation', 1),
  ('Mod upload', 2),
  ('Mod Browsing', 3),
  ('Community', 4),
  ('Nexus premium', 5),
  ('Mod collections', 6);
