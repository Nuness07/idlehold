import { useTranslation } from 'react-i18next'
import type { Skill } from '../../api/client'
import { useFormat } from '../../lib/format'

interface StatisticsProps {
  /** Every trade's skill, in the server's order; an untouched trade has no XP. */
  skills: Skill[]
  inventory: Record<string, number>
}

/** Totals over what the server sent: levels, experience, stored items and trades begun. */
export function Statistics({ skills, inventory }: StatisticsProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0)
  const totalXp = skills.reduce((sum, skill) => sum + skill.xp, 0)
  const itemsStored = Object.values(inventory).reduce((sum, count) => sum + count, 0)
  const started = skills.filter((skill) => skill.xp > 0).length

  const rows = [
    [t('statistics.totalLevel'), format.count(totalLevel)],
    [t('statistics.totalXp'), format.count(totalXp)],
    [t('statistics.itemsStored'), format.count(itemsStored)],
    [t('statistics.tradesStarted'), t('statistics.tradesStartedValue', { started, total: skills.length })],
  ] as const

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="paper flex items-baseline justify-between gap-4 rounded px-4 py-3">
          <dt className="text-[16px] text-muted">{label}</dt>
          <dd className="text-xl font-extrabold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
