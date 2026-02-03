import { Typography } from '@/components/Typography'
import { UniverseBackground } from '@/components/UniverseBackground'
import { OpenAddFeedbackButton } from '@/components/OpenAddFeedbackButton'
import { LoaderDebugModal } from '@/components/LoaderDebugModal'

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-surface-base text-neutral-strong overflow-hidden">
      <UniverseBackground />
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg gap-6 px-6">
        <div className="flex flex-col items-center w-full gap-2">
          <LoaderDebugModal>
            <Typography
              variant="heading-lg"
              as="span"
              className="w-full text-center text-neutral-strong block"
            >
              Welcome to Nexus Insights
            </Typography>
          </LoaderDebugModal>
          <Typography
            variant="body-md"
            className="w-full text-center text-neutral-subdued"
          >
            Log, synthesise and group qualitative user feedback from interviews, Reddit, Discord, Slack and more.
          </Typography>
        </div>
        <OpenAddFeedbackButton
          className="inline-flex justify-center items-center rounded-base font-medium bg-primary-moderate text-neutral-inverted hover:bg-primary-strong px-4 py-2 text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
        >
          Add feedback
        </OpenAddFeedbackButton>
      </div>
    </div>
  )
}

