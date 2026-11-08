import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
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
  /** The trade on screen, or `null` while the village or a menu screen is. */
  selected: string | null
  /** Whether the village is on screen. */
  villageSelected: boolean
  onSelect: (skillId: string) => void
  onSelectVillage: () => void
}

/**
 * A rail entry, a signboard pointing right. On wide screens it reaches past the panel's frame
 * (36px) by 20px, and the one on screen pokes out a little further.
 */
function railSign(selected: boolean) {
  return cn('rail-sign block w-full shrink-0 text-left lg:w-[calc(100%+56px)]', selected && 'lg:translate-x-2')
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

/** The tower on its own, unframed, in a box as wide as a framed emblem so the names line up. */
function VillageSign() {
  const { t } = useTranslation()
  return (
    <>
      <span aria-hidden className="grid h-12 w-[46px] shrink-0 place-items-center">
        <PixelSprite src={towerSprite} width={32} height={32} />
      </span>
      <span>{t('village.rail')}</span>
    </>
  )
}

/** A trade's emblem, name, working mark and level. */
function TradeSignContent({ skillId, skill, working }: Pick<RailTrade, 'skillId' | 'skill' | 'working'>) {
  const { t } = useTranslation()
  const text = useContentText()
  const trade = tradeLabel(skillId)
  return (
    <>
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
      {working && <span aria-label={t('trades.working')} className="size-2 rounded-full bg-ochre" />}
      <span className="ml-auto pl-4 tabular-nums">{skill.level}</span>
    </>
  )
}

/**
 * The village, then the trades under a heading per group (gathering, production). A column on wide
 * screens. On phones only the entry on screen shows, and it opens the same column as a list below it.
 */
export function TradeRail({ trades, selected, villageSelected, onSelect, onSelectVillage }: TradeRailProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const current = trades.find((trade) => trade.skillId === selected)

  // The open list closes on a tap outside it or on Escape, which returns focus to the toggle.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (action: () => void) => {
    action()
    setOpen(false)
  }

  return (
    <nav ref={navRef} aria-label={t('trades.heading')} className="relative px-4 py-3 lg:px-0 lg:py-2">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('trades.heading')}: ${current ? text.tradeName(current.skillId) : t('village.rail')}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(railSign(false), 'lg:hidden')}
      >
        <span className={signBoard}>
          {current ? <TradeSignContent {...current} /> : <VillageSign />}
          <ChevronDown
            aria-hidden
            className={cn('size-5 shrink-0 transition-transform', !current && 'ml-auto', open && 'rotate-180')}
          />
        </span>
      </button>

      {/* On phones a dropdown over the screen below; on wide screens the rail itself. */}
      <div
        id={listId}
        className={cn(
          'absolute inset-x-0 top-full z-30 flex-col gap-5 wood-board wood-frame shadow-[0_12px_24px_rgb(0_0_0/0.5)]',
          'lg:static lg:flex lg:border-0 lg:bg-transparent lg:bg-none lg:shadow-none lg:[border-image:none]',
          open ? 'flex' : 'hidden',
        )}
      >
        <button
          type="button"
          onClick={() => choose(onSelectVillage)}
          aria-pressed={villageSelected}
          className={railSign(villageSelected)}
        >
          <span className={signBoard}>
            <VillageSign />
          </span>
        </button>

        {byCategory(trades).map(([category, group]) => (
          <section key={category} aria-labelledby={`trade-group-${category}`} className="flex flex-col">
            <h2
              id={`trade-group-${category}`}
              className="mb-1 px-1 text-xs font-extrabold tracking-[0.14em] text-parchment uppercase"
            >
              {t(`trades.groups.${category}`)}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {group.map(({ skillId, skill, working }) => (
                <li key={skillId}>
                  <button
                    type="button"
                    onClick={() => choose(() => onSelect(skillId))}
                    aria-pressed={skillId === selected}
                    className={railSign(skillId === selected)}
                  >
                    <span className={signBoard}>
                      <TradeSignContent skillId={skillId} skill={skill} working={working} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
