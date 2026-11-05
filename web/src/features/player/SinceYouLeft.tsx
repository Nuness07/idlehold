import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { itemCount, tradeLabel } from '../../content/labels'
import { formatCount, formatDuration } from '../../lib/format'
import type { AwaySummary } from './awaySummary'

interface SinceYouLeftProps {
  summary: AwaySummary
  onDismiss: () => void
}

function joinWithAnd(parts: ReactNode[]): ReactNode[] {
  return parts.flatMap((part, index) => {
    if (index === 0) return [part]
    return [index === parts.length - 1 ? ' and ' : ', ', part]
  })
}

/** What the hold produced while the player was away, told as one sentence. */
export function SinceYouLeft({ summary, onDismiss }: SinceYouLeftProps) {
  const gains: ReactNode[] = [
    ...summary.items.map((item) => (
      <span key={item.itemId}>
        <strong className="font-extrabold">{formatCount(item.gained)}</strong> {itemCount(item.itemId, item.gained)}
      </span>
    )),
    ...summary.levels.map((skill) => (
      <span key={skill.skillId}>
        {tradeLabel(skill.skillId).name} rose to <strong className="font-extrabold">level {skill.level}</strong>
      </span>
    )),
  ]

  return (
    <section
      aria-label="Since you left"
      className="flex items-start gap-4 rounded-md border border-oxblood/25 bg-limewash px-5 py-4"
    >
      <p className="text-lg leading-snug">
        While you were away for <strong className="font-extrabold">{formatDuration(summary.awayMs)}</strong>, your
        hold gathered {joinWithAnd(gains)}.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="-mt-1 ml-auto grid size-9 shrink-0 place-items-center rounded text-muted hover:bg-ink/5 hover:text-ink"
        aria-label="Dismiss summary"
      >
        <X className="size-5" />
      </button>
    </section>
  )
}
