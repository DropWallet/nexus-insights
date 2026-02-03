'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export type TagCountRow = {
  tagId: string
  tagName: string
  countAll: number
  countByTheme: Record<string, number>
}

interface TagFrequencyChartProps {
  tagCounts: TagCountRow[]
  themes: { id: string; name: string }[]
}

export function TagFrequencyChart({ tagCounts, themes }: TagFrequencyChartProps) {
  const [themeId, setThemeId] = useState<string | null>(null)

  const data = useMemo(() => {
    return tagCounts.map((t) => ({
      name: t.tagName,
      count: themeId == null ? t.countAll : (t.countByTheme[themeId] ?? 0),
    }))
  }, [tagCounts, themeId])

  if (tagCounts.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-surface-low border border-stroke-neutral-translucent-weak text-neutral-subdued text-body-md">
        No tags yet. Tags appear here after you add feedback and extract insights.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="theme-filter" className="text-body-sm font-medium text-neutral-moderate">
          Filter by theme
        </label>
        <select
          id="theme-filter"
          value={themeId ?? ''}
          onChange={(e) => setThemeId(e.target.value === '' ? null : e.target.value)}
          className="rounded-base border border-stroke-neutral-translucent-subdued bg-surface-low px-3 py-2 text-body-sm text-neutral-strong focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
        >
          <option value="">All themes</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="h-[400px] w-full rounded-lg bg-surface-low border border-stroke-neutral-translucent-weak p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-neutral-translucent-subdued" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--color-neutral-subdued)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              axisLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-neutral-subdued)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              axisLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-mid)',
                border: '1px solid var(--color-stroke-neutral-translucent-subdued)',
                borderRadius: 'var(--radius-base)',
                color: 'var(--color-neutral-strong)',
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--color-neutral-moderate)' }}
              formatter={(value: number | undefined) => [value ?? 0, 'Insights']}
              labelFormatter={(label) => `Tag: ${label}`}
            />
            <Bar dataKey="count" fill="var(--color-primary-moderate)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
