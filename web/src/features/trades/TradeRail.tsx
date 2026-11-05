import type { Skill } from '../../api/client'
import { tradeLabel } from '../../content/labels'
import { TradeEmblem } from './TradeEmblem'

interface TradeRailProps {
  trades: { skillId: string; skill: Skill; working: boolean }[]
  selected: string
}

/** The list of trades. A column on wide screens, a row of tabs on phones. */
export function TradeRail({ trades, selected }: TradeRailProps) {
  return (
    <nav aria-label="Trades" className="lg:py-6">
      <h2 className="sr-only lg:not-sr-only lg:mb-3 lg:block lg:px-6 lg:text-xs lg:font-extrabold lg:tracking-[0.14em] lg:text-muted lg:uppercase">
        Trades
      </h2>
      <ul className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:gap-1 lg:px-3 lg:py-0">
        {trades.map(({ skillId, skill, working }) => {
          const trade = tradeLabel(skillId)
          const isSelected = skillId === selected
          return (
            <li key={skillId} className="shrink-0">
              {/* Not a link yet: with a single trade there is nothing to switch to. */}
              <div
                aria-current={isSelected ? 'true' : undefined}
                className={`flex items-center gap-3 rounded border px-3 py-2.5 text-[16px] font-bold text-ink ${
                  isSelected ? 'border-ink/30 bg-white' : 'border-transparent'
                }`}
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
                <span>{trade.name}</span>
                {working && (
                  <span aria-label="working" className="size-2 rounded-full bg-ochre" />
                )}
                <span className="ml-auto pl-4 tabular-nums">{skill.level}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
