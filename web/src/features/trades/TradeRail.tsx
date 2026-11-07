import { Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Skill } from '../../api/client'
import { tradeLabel } from '../../content/labels'
import { useContentText } from '../../content/text'
import { TradeEmblem } from './TradeEmblem'
import { cn } from '../../lib/cn'

interface TradeRailProps {
  trades: { skillId: string; skill: Skill; working: boolean }[]
  /** The trade on screen, or `null` while the village is. */
  selected: string | null
  onSelect: (skillId: string) => void
  onSelectVillage: () => void
}

/** A rail entry: the selected one is lifted off the paper. */
function railButton(selected: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left text-[16px] font-bold text-ink transition-colors',
    selected ? 'border-ink/40 bg-white' : 'paper border-transparent hover:bg-white',
  )
}

/** The list of trades. A column on wide screens, a row of tabs on phones. */
export function TradeRail({ trades, selected, onSelect, onSelectVillage }: TradeRailProps) {
  const { t } = useTranslation()
  const text = useContentText()

  return (
    <nav aria-label={t('trades.heading')} className="lg:py-2">
      <h2 className="sr-only lg:not-sr-only lg:mb-3 lg:block lg:px-1 lg:text-xs lg:font-extrabold lg:tracking-[0.14em] lg:text-parchment lg:uppercase">
        {t('trades.heading')}
      </h2>
      <ul className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:gap-2 lg:px-0 lg:py-0">
        <li className="shrink-0 lg:mb-2">
          <button
            type="button"
            onClick={onSelectVillage}
            aria-pressed={selected === null}
            className={railButton(selected === null)}
          >
            <span aria-hidden className="grid size-8 place-items-center rounded bg-oxblood text-oxblood-ink">
              <Flame className="size-[18px]" strokeWidth={2} />
            </span>
            <span>{t('village.rail')}</span>
          </button>
        </li>
        {trades.map(({ skillId, skill, working }) => {
          const trade = tradeLabel(skillId)
          const isSelected = skillId === selected
          return (
            <li key={skillId} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(skillId)}
                aria-pressed={isSelected}
                className={railButton(isSelected)}
              >
                {trade.emblem ? (
                  <TradeEmblem trade={trade} scale={1} fallbackClassName="size-[18px]" />
                ) : (
                  <span
                    aria-hidden
                    className="grid size-8 place-items-center rounded text-oxblood-ink"
                    style={{ backgroundColor: trade.paint }}
                  >
                    <trade.Icon className="size-[18px]" strokeWidth={2} />
                  </span>
                )}
                <span>{text.tradeName(skillId)}</span>
                {working && (
                  <span aria-label={t('trades.working')} className="size-2 rounded-full bg-ochre" />
                )}
                <span className="ml-auto pl-4 tabular-nums">{skill.level}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
