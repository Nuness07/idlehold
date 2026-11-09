import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameAction } from '../api/client'
import { PixelSprite } from './PixelSprite'
import { itemSprite } from '../content/labels'
import { useContentText } from '../content/text'
import { cn } from '../lib/cn'
import { useFormat } from '../lib/format'

/** A recipe with more inputs than this shows the first few and a slot that expands the list. */
export const VISIBLE_SLOTS = 6

interface MaterialSlotsProps {
  inputs: GameAction['inputs']
  inventory: Record<string, number>
  className?: string
}

/**
 * What a recipe takes: one slot per material with its sprite and what the stores have of what it needs, short
 * counts in red. A long recipe folds into a slot that expands the list.
 */
export function MaterialSlots({ inputs, inventory, className }: MaterialSlotsProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const [expanded, setExpanded] = useState(false)

  const folds = inputs.length > VISIBLE_SLOTS
  const shown = folds && !expanded ? inputs.slice(0, VISIBLE_SLOTS - 1) : inputs
  const hidden = inputs.length - shown.length

  return (
    <ul aria-label={t('materials.label')} className={cn('flex flex-wrap gap-2', className)}>
      {shown.map((input) => {
        const have = inventory[input.itemId] ?? 0
        const short = have < input.quantity
        const sprite = itemSprite(input.itemId)
        return (
          <li
            key={input.itemId}
            title={text.itemName(input.itemId)}
            className="relative grid size-12 place-items-center border-2 border-ink bg-limewash"
          >
            {sprite && <PixelSprite src={sprite} width={32} height={32} />}
            <span className="sr-only">
              {t('materials.slot', {
                have: format.count(have),
                need: format.count(input.quantity),
                item: text.itemCount(input.itemId, input.quantity),
              })}
            </span>
            <span
              aria-hidden
              className={cn(
                'absolute right-0.5 bottom-0 text-[12px] leading-none font-extrabold text-ink [text-shadow:0_1px_0_white]',
                short && 'text-danger',
              )}
            >
              {format.count(have)}/{format.count(input.quantity)}
            </span>
          </li>
        )
      })}
      {folds && (
        <li>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? t('materials.showFewer') : t('materials.showMore', { count: hidden })}
            onClick={() => setExpanded((open) => !open)}
            className="grid size-12 place-items-center border-2 border-ink bg-limewash text-[15px] font-extrabold text-ink hover:bg-stone"
          >
            {expanded ? '−' : `+${hidden}`}
          </button>
        </li>
      )}
    </ul>
  )
}
