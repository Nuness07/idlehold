import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Storage } from '../../api/client'
import { PixelSprite } from '../../components/PixelSprite'
import { Tooltip, TooltipTitle } from '../../components/Tooltip'
import { WoodButton } from '../../components/WoodButton'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'
import { useFormat } from '../../lib/format'

/** Slots per page: six rows of four on a phone, four rows of six on a wide screen. */
export const SLOTS_PER_PAGE = 24

interface StoresProps {
  /** The stores as the server splits them: stacks in the game's item order, and how many slots there are. */
  storage: Storage
  /** Item that just received a confirmed reward; its last stack is highlighted briefly. */
  freshItemId: string | undefined
}

/**
 * The storehouse as a grid of slots, a page at a time: each stack shows its item's sprite with the count in
 * the corner and the name in a tooltip, and the free slots show empty. The server decides how the stores
 * split into stacks and how many slots there are; this only lays them out.
 */
export function Stores({ storage, freshItemId }: StoresProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const { slots, slotCount } = storage

  // A rule change could leave more stacks than slots; they still show, on the last pages.
  const pageCount = Math.max(1, Math.ceil(Math.max(slotCount, slots.length) / SLOTS_PER_PAGE))
  const [chosenPage, setPage] = useState(0)
  const page = Math.min(chosenPage, pageCount - 1)
  const first = page * SLOTS_PER_PAGE
  const pageSlots = slots.slice(first, first + SLOTS_PER_PAGE)
  const emptySlots = Math.max(0, Math.min(SLOTS_PER_PAGE, slotCount - first) - pageSlots.length)
  const lastFreshIndex = slots.findLastIndex((slot) => slot.itemId === freshItemId)
  const full = slots.length >= slotCount

  return (
    <section aria-labelledby="stores-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 id="stores-heading" className="text-[15px] font-bold text-parchment">
          {t('stores.used', { used: format.count(slots.length), total: format.count(slotCount) })}
          {full && (
            <span className="ml-2 rounded-sm bg-danger px-1.5 py-0.5 text-[13px] font-extrabold text-parchment uppercase">
              {t('stores.full')}
            </span>
          )}
        </h2>
        {pageCount > 1 && (
          <nav aria-label={t('stores.pages')} className="flex items-center gap-3">
            <WoodButton
              className="px-1 py-1 disabled:opacity-50"
              aria-label={t('stores.previousPage')}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft aria-hidden size={18} />
            </WoodButton>
            <span className="text-[15px] font-bold text-parchment tabular-nums" aria-live="polite">
              {t('stores.page', { page: page + 1, count: pageCount })}
            </span>
            <WoodButton
              className="px-1 py-1 disabled:opacity-50"
              aria-label={t('stores.nextPage')}
              disabled={page === pageCount - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight aria-hidden size={18} />
            </WoodButton>
          </nav>
        )}
      </div>

      {slots.length === 0 && <p className="paper max-w-xl rounded px-4 py-3 text-muted">{t('stores.empty')}</p>}

      <ul aria-label={t('stores.heading')} className="grid grid-cols-[repeat(auto-fill,80px)] gap-1">
        {pageSlots.map((slot, index) => (
          <li key={first + index}>
            <StackSlot itemId={slot.itemId} count={slot.quantity} fresh={first + index === lastFreshIndex} />
          </li>
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <li key={`empty-${first + pageSlots.length + index}`} aria-label={t('stores.emptySlot')}>
            <div className="item-slot size-20 opacity-80" />
          </li>
        ))}
      </ul>
    </section>
  )
}

interface StackSlotProps {
  itemId: string
  count: number
  fresh: boolean
}

/** One stack: the sprite set into the slot, the count in its corner, the name in a tooltip. */
function StackSlot({ itemId, count, fresh }: StackSlotProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const sprite = itemSprite(itemId)
  const name = text.itemName(itemId)

  return (
    <Tooltip content={<TooltipTitle>{name}</TooltipTitle>}>
      <button
        type="button"
        aria-label={t('stores.slot', { name, count: format.count(count) })}
        className="item-slot relative grid size-20 place-items-center outline-offset-2 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ochre"
      >
        {/* The sprite overhangs the rim a little, like an item set into the slot. */}
        {sprite ? (
          <PixelSprite src={sprite} width={32} height={32} scale={2} className="absolute" />
        ) : (
          <span className="text-[11px] leading-tight text-parchment">{name}</span>
        )}
        <span
          aria-hidden
          className={cn(
            'absolute -right-2.5 -bottom-2.5 text-[15px] leading-none font-extrabold tabular-nums',
            '[text-shadow:1px_0_0_#000,-1px_0_0_#000,0_1px_0_#000,0_-1px_0_#000,1px_1px_0_#000]',
            'transition-colors duration-700',
            fresh ? 'text-ochre-wash' : 'text-parchment',
          )}
        >
          {format.count(count)}
        </span>
      </button>
    </Tooltip>
  )
}
