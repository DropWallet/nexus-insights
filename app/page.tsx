import Link from 'next/link'
import { Typography } from '@/components/Typography'

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Typography variant="heading-xl" as="h1" className="mb-2">
          Nexus Insights
        </Typography>
        <Typography variant="body-lg" className="text-neutral-moderate">
          Log, synthesise and group qualitative user feedback from interviews, Reddit, Discord, Slack and more.
        </Typography>
        <div className="flex gap-4 pt-4">
          <Link
            href="/ingest"
            className="inline-flex items-center justify-center rounded-base font-medium bg-primary-moderate text-neutral-inverted hover:bg-primary-strong px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-moderate focus:ring-offset-2"
          >
            Add feedback
          </Link>
          <Link
            href="/board"
            className="inline-flex items-center justify-center rounded-base font-medium bg-surface-translucent-mid border border-stroke-neutral-translucent-subdued text-neutral-strong hover:bg-surface-translucent-low px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-moderate focus:ring-offset-2"
          >
            Board
          </Link>
          <Link
            href="/insights"
            className="inline-flex items-center justify-center rounded-base font-medium bg-surface-translucent-mid border border-stroke-neutral-translucent-subdued text-neutral-strong hover:bg-surface-translucent-low px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-moderate focus:ring-offset-2"
          >
            List view
          </Link>
          <Link
            href="/analytics"
            className="inline-flex items-center justify-center rounded-base font-medium bg-surface-translucent-mid border border-stroke-neutral-translucent-subdued text-neutral-strong hover:bg-surface-translucent-low px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-moderate focus:ring-offset-2"
          >
            Analytics
          </Link>
        </div>
        <div className="mt-8 p-4 bg-surface-low rounded-lg border border-stroke-neutral-translucent-weak">
          <Typography variant="title-sm" className="mb-2">
            Phase 2
          </Typography>
          <Typography variant="body-sm" className="text-neutral-subdued">
            Add feedback → Analyze → insights land in Uncategorised. Open Board to drag cards between themes, filter by tags, and add/remove tags on cards.
          </Typography>
        </div>
      </div>
    </div>
  )
}
