import { useTranslation } from 'react-i18next'
import type { Skill, SkillCategory } from '../../api/client'
import { PixelSprite } from '../../components/PixelSprite'
import { towerSprite, tradeLabel } from '../../content/labels'
import { useContentText } from '../../content/text'
import { TradeEmblem } from './TradeEmblem'
import { cn } from '../../lib/cn'

interface RailTrade {
  skillId: string
  category: SkillCategory
  skill: Skill
  working: boolean
}

interface TradeRailProps {
  /** Every trade, in the order the server lists them. */
  trades: RailTrade[]
  /** The trade on screen, or `null` while the village is. */
  selected: string | null
  onSelect: (skillId: string) => void
  onSelectVillage: () => void
}

/**
 * A rail entry, a signboard pointing right. On wide screens it reaches past the panel's frame
 * (36px) by 20px, and the one on screen pokes out a little further.
 */
function railSign(selected: boolean) {
  return cn('rail-sign block shrink-0 text-left lg:w-[calc(100%+56px)]', selected && 'lg:translate-x-2')
}

const signBoard = 'rail-sign-board flex h-13 items-center gap-3 text-[16px] font-bold'

/** The trades split by group, keeping the server's order for the groups and the trades in them. */
function byCategory(trades: RailTrade[]) {
  const groups = new Map<SkillCategory, RailTrade[]>()
  for (const trade of trades) {
    groups.set(trade.category, [...(groups.get(trade.category) ?? []), trade])
  }
  return [...groups]
}

/**
 * The village, then the trades under a heading per group (gathering, production).
 * A column on wide screens, a row of tabs on phones, where the group headings are left to screen readers.
 */
export function TradeRail({ trades, selected, onSelect, onSelectVillage }: TradeRailProps) {
  const { t } = useTranslation()
  const text = useContentText()

  return (
    <nav aria-label={t('trades.heading')} className="lg:py-2">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0 lg:py-0">
        <button
          type="button"
          onClick={onSelectVillage}
          aria-pressed={selected === null}
          className={railSign(selected === null)}
        >
          <span className={signBoard}>
            {/* The tower stands on its own, unframed, in a box as wide as a framed emblem so the names line up. */}
            <span aria-hidden className="grid h-12 w-[46px] shrink-0 place-items-center">
              <PixelSprite src={towerSprite} width={32} height={32} />
            </span>
            <span>{t('village.rail')}</span>
          </span>
        </button>

        {byCategory(trades).map(([category, group]) => (
          <section key={category} aria-labelledby={`trade-group-${category}`} className="flex shrink-0 gap-2 lg:flex-col">
            <h2
              id={`trade-group-${category}`}
              className="sr-only lg:not-sr-only lg:mb-1 lg:block lg:px-1 lg:text-xs lg:font-extrabold lg:tracking-[0.14em] lg:text-parchment lg:uppercase"
            >
              {t(`trades.groups.${category}`)}
            </h2>
            <ul className="flex gap-2 lg:flex-col lg:gap-1.5">
              {group.map(({ skillId, skill, working }) => {
                const trade = tradeLabel(skillId)
                const isSelected = skillId === selected
                return (
                  <li key={skillId} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelect(skillId)}
                      aria-pressed={isSelected}
                      className={railSign(isSelected)}
                    >
                      <span className={signBoard}>
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
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
