import { useTranslation } from 'react-i18next'
import { PixelSprite } from '../../components/PixelSprite'
import { Tooltip, TooltipTitle } from '../../components/Tooltip'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'
import { useFormat } from '../../lib/format'

interface StoresProps {
  inventory: Record<string, number>
  /** Every item in the game's order, so each one keeps its place in the grid while counts change. */
  itemOrder: string[]
  /** Item that just received a confirmed reward, highlighted briefly. */
  freshItemId: string | undefined
}

/**
 * Everything the hold has stored, as a grid of slots: the item's sprite with its count in the corner, and
 * its name in a tooltip. Items keep the game's order, so a slot does not jump around as its count grows.
 */
export function Stores({ inventory, itemOrder, freshItemId }: StoresProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()

  const position = new Map(itemOrder.map((itemId, index) => [itemId, index]))
  const entries = Object.entries(inventory)
    .filter(([, count]) => count > 0)
    // An item the content no longer lists still shows, after the known ones.
    .sort(([a], [b]) => (position.get(a) ?? Infinity) - (position.get(b) ?? Infinity) || a.localeCompare(b))

  if (entries.length === 0) {
    return <p className="paper max-w-xl rounded px-4 py-3 text-muted">{t('stores.empty')}</p>
  }

  return (
    <ul aria-label={t('stores.heading')} className="grid grid-cols-[repeat(auto-fill,80px)] gap-1">
      {entries.map(([itemId, count]) => {
        const sprite = itemSprite(itemId)
        const name = text.itemName(itemId)
        return (
          <li key={itemId}>
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
                    itemId === freshItemId ? 'text-ochre-wash' : 'text-parchment',
                  )}
                >
                  {format.count(count)}
                </span>
              </button>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
