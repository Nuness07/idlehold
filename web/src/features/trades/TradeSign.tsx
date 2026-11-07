import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { GameAction, Skill } from '../../api/client'
import { tradeLabel } from '../../content/labels'
import { useContentText } from '../../content/text'
import { formatDuration, useFormat } from '../../lib/format'
import { TradeEmblem } from './TradeEmblem'

interface TradeSignProps {
  skillId: string
  skill: Skill
  /** The action currently worked in this trade, used to estimate time to the next level. */
  working: GameAction | undefined
  /** Changes when the server confirms a level-up; the sign swings once on change. */
  swingKey: number
}

/** The wrought-iron bracket the sign hangs from: wall plate, scrolled arm and two ring hangers. */
function Bracket() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 640 44"
      preserveAspectRatio="none"
      className="block h-11 w-full text-iron drop-shadow-[0_2px_0_rgb(0_0_0/0.6)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Wall plate */}
      <rect x="1" y="1" width="10" height="34" rx="2" fill="currentColor" stroke="none" />
      {/* Arm */}
      <path d="M11 6 H632" strokeWidth="4" />
      {/* Scroll brace under the arm */}
      <path d="M11 30 C 40 30, 52 22, 60 14 C 66 8, 76 8, 78 14 C 80 20, 72 22, 70 17" strokeWidth="2.5" />
      {/* Hangers: a ring on the arm and a short rod down to each top corner */}
      <circle cx="40" cy="10" r="3.5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path d="M40 13.5 V44" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx="600" cy="10" r="3.5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path d="M600 13.5 V44" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function nextLevelLine(
  t: TFunction,
  count: (value: number) => string,
  skill: Skill,
  working: GameAction | undefined,
): string {
  if (skill.xp === 0) return t('sign.noXp')
  if (skill.nextLevelXp === null) return t('sign.mastered')

  const toNext = skill.nextLevelXp - skill.xp
  if (!working) return t('sign.xpToLevel', { xp: count(toNext), level: skill.level + 1 })

  // An estimate from the server's own numbers; the server still decides when the level arrives.
  const cycles = Math.ceil(toNext / working.xpPerCompletion)
  return t('sign.levelIn', { level: skill.level + 1, time: formatDuration(cycles * working.durationMs) })
}

/** The active trade's painted sign, hung from its bracket. */
export function TradeSign({ skillId, skill, working, swingKey }: TradeSignProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const trade = tradeLabel(skillId)
  const span = skill.nextLevelXp === null ? 0 : skill.nextLevelXp - skill.levelStartXp
  const fill = span === 0 ? (skill.xp === 0 ? 0 : 1) : (skill.xp - skill.levelStartXp) / span

  return (
    <section aria-labelledby="trade-name" className="max-w-3xl pt-4">
      <Bracket />
      <div key={swingKey} className={swingKey > 0 ? 'origin-top motion-safe:animate-sign-swing' : undefined}>
        <div className="relative rounded-md px-7 pt-6 pb-5 text-oxblood-ink sm:px-9" style={{ backgroundColor: trade.paint }}>
          {/* Signwriter's lining: a thin rule painted just inside the board's edge. */}
          <div aria-hidden className="pointer-events-none absolute inset-2 rounded-sm border border-oxblood-ink/45" />

          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2">
            <TradeEmblem trade={trade} scale={2} fallbackClassName="size-10 shrink-0 sm:size-12" />
            <h1 id="trade-name" className="font-gothic text-[clamp(2.5rem,4.5vw,4rem)] leading-none font-extrabold">
              {text.tradeName(skillId)}
            </h1>
            <p className="font-gothic text-3xl leading-none font-bold sm:ml-auto sm:text-4xl">
              {t('sign.level', { level: skill.level })}
            </p>
          </div>

          <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-black/25">
            <div
              className="h-full origin-left rounded-full bg-oxblood-ink transition-transform duration-500"
              style={{ transform: `scaleX(${fill})` }}
            />
          </div>
          <p className="relative mt-2 text-[16px] font-medium">{nextLevelLine(t, format.count, skill, working)}</p>
        </div>
      </div>
    </section>
  )
}
