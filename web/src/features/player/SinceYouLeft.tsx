import { X } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useContentText } from '../../content/text'
import { formatDuration, useFormat } from '../../lib/format'
import type { AwaySummary } from './awaySummary'

interface SinceYouLeftProps {
  summary: AwaySummary
  onDismiss: () => void
}

/** Joins elements the way the language does: "a, b and c" / "a, b e c". */
function joinList(parts: ReactNode[], language: string): ReactNode[] {
  const placeholders = parts.map((_, index) => `\u0000${index}\u0000`)
  return new Intl.ListFormat(language, { type: 'conjunction' })
    .formatToParts(placeholders)
    .map((part, index) =>
      part.type === 'element'
        ? <Fragment key={index}>{parts[placeholders.indexOf(part.value)]}</Fragment>
        : <Fragment key={index}>{part.value}</Fragment>,
    )
}

/** What the hold produced while the player was away, told as one sentence. */
export function SinceYouLeft({ summary, onDismiss }: SinceYouLeftProps) {
  const { t, i18n } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const strong = { strong: <strong className="font-extrabold" /> }

  const gains: ReactNode[] = [
    ...summary.items.map((item) => (
      <Trans
        key={item.itemId}
        i18nKey="away.item"
        values={{ amount: format.count(item.gained), item: text.itemCount(item.itemId, item.gained) }}
        components={strong}
      />
    )),
    ...summary.levels.map((skill) => (
      <Trans
        key={skill.skillId}
        i18nKey="away.level"
        values={{ trade: text.tradeName(skill.skillId), level: skill.level }}
        components={strong}
      />
    )),
  ]

  return (
    <section
      aria-label={t('away.label')}
      className="flex items-start gap-4 rounded-md border border-oxblood/25 bg-limewash px-5 py-4"
    >
      <p className="text-lg leading-snug">
        <Trans
          i18nKey="away.sentence"
          values={{ time: formatDuration(summary.awayMs) }}
          components={{ ...strong, gains: <>{joinList(gains, i18n.language)}</> }}
        />
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="-mt-1 ml-auto grid size-9 shrink-0 place-items-center rounded text-muted hover:bg-ink/5 hover:text-ink"
        aria-label={t('away.dismiss')}
      >
        <X className="size-5" />
      </button>
    </section>
  )
}
