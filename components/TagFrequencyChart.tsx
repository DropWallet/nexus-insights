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
  Rectangle,
} from 'recharts'

const DEFAULT_TAG_COLORS = [
  '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#84cc16', '#14b8a6', '#6366f1', '#a855f7', '#f43f5e',
]

const Y_AXIS_LABEL_WIDTH = 200
const LABEL_TRUNCATE_LENGTH = 28

export type TagCountRow = {
  tagId: string
  tagName: string
  colorCode?: string | null
  countAll: number
  countByTheme: Record<string, number>
}

interface TagFrequencyChartProps {
  tagCounts: TagCountRow[]
  themes: { id: string; name: string }[]
}

function getTagColor(tagIndex: number, colorCode?: string | null): string {
  if (colorCode && /^#[0-9A-Fa-f]{3,8}$/.test(colorCode)) return colorCode
  return DEFAULT_TAG_COLORS[tagIndex % DEFAULT_TAG_COLORS.length]
}

function truncateLabel(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name
  return `${name.slice(0, maxLen - 1)}…`
}

// Custom bar shape: use fill from data (payload) so each bar gets its color
function ColoredBarShape(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: number | [number, number, number, number]
  fill?: string
  payload?: { fill?: string }
  [key: string]: unknown
}) {
  const { x = 0, y = 0, width = 0, height = 0, radius, fill: fillProp, payload, ...rest } = props
  const fill = (fillProp ?? (payload?.fill as string)) ?? 'var(--color-primary-moderate)'
  const rectRadius: number | [number, number, number, number] | undefined =
    Array.isArray(radius) && radius.length === 4
      ? (radius as [number, number, number, number])
      : typeof radius === 'number'
        ? radius
        : undefined
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      radius={rectRadius}
      fill={fill}
      {...rest}
    />
  )
}

// Custom Y-axis tick: single-line truncated text, no wrapping
function YAxisTick(props: {
  x?: number
  y?: number
  payload?: { value?: string }
  [key: string]: unknown
}) {
  const { x = 0, y = 0, payload } = props
  const text = payload?.value ?? ''
  const truncated = truncateLabel(text, LABEL_TRUNCATE_LENGTH)
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="var(--color-neutral-subdued)"
        fontSize={12}
      >
        {truncated}
      </text>
    </g>
  )
}

export function TagFrequencyChart({ tagCounts, themes }: TagFrequencyChartProps) {
  const [themeId, setThemeId] = useState<string | null>(null)

  const data = useMemo(() => {
    return tagCounts.map((t, i) => ({
      name: t.tagName,
      count: themeId == null ? t.countAll : (t.countByTheme[themeId] ?? 0),
      fill: getTagColor(i, t.colorCode),
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
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-stroke-neutral-translucent-subdued" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-neutral-subdued)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              axisLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={Y_AXIS_LABEL_WIDTH}
              tick={<YAxisTick />}
              tickLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              axisLine={{ stroke: 'var(--color-stroke-neutral-translucent-weak)' }}
              interval={0}
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
            <Bar
              dataKey="count"
              radius={[0, 2, 2, 0]}
              minPointSize={4}
              isAnimationActive={false}
              shape={<ColoredBarShape />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
