import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameAction } from '../../api/client'
import { PixelSprite } from '../../components/PixelSprite'
import { WoodButton } from '../../components/WoodButton'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'
import { useFormat } from '../../lib/format'

/** A recipe with more inputs than this shows the first few and a slot that expands the card. */
export const VISIBLE_SLOTS = 6

interface ToolCardProps {
  /** The tool shown: the next tier to make, or the best one owned when nothing better exists. */
  itemId: string
  /** The recipe for the next tier, or `undefined` when the owned tool is the best there is. */
  recipe: GameAction | undefined
  inventory: Record<string, number>
  working: boolean
  pending: boolean
  onBuild: (actionId: string) => void
}

/**
 * One tool family: the tool in an iron frame, its name, what it takes and a button to build it.
 * Whether it can be built is the server's call; the stores only decide how the slots and button look.
 */
export function ToolCard({ itemId, recipe, inventory, working, pending, onBuild }: ToolCardProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const [expanded, setExpanded] = useState(false)

  const sprite = itemSprite(itemId)
  const inputs = recipe?.inputs ?? []
  const missing = inputs.some((input) => (inventory[input.itemId] ?? 0) < input.quantity)
  const folds = inputs.length > VISIBLE_SLOTS
  const shown = folds && !expanded ? inputs.slice(0, VISIBLE_SLOTS - 1) : inputs
  const hidden = inputs.length - shown.length
  const titleId = `tool-${itemId}`

  return (
    <article aria-labelledby={titleId} className="paper flex flex-col items-center gap-3 rounded-sm px-4 pt-4 pb-4">
      <div className="iron-frame grid size-24 place-items-center bg-frame-well">
        {sprite && <PixelSprite src={sprite} width={32} height={32} scale={2} />}
      </div>

      <div className="text-center">
        <h3 id={titleId} className="text-lg leading-tight font-extrabold">
          {text.itemName(itemId)}
        </h3>
        <p className="text-[14px] text-muted">
          {recipe
            ? t('tools.meta', { time: format.duration(recipe.durationMs), xp: recipe.xpPerCompletion })
            : t('tools.best')}
        </p>
      </div>

      {recipe && (
        <>
          <ul aria-label={t('tools.materials')} className="flex flex-wrap justify-center gap-2">
            {shown.map((input) => {
              const have = inventory[input.itemId] ?? 0
              const short = have < input.quantity
              const slotSprite = itemSprite(input.itemId)
              return (
                <li
                  key={input.itemId}
                  title={text.itemName(input.itemId)}
                  className="iron-slot relative grid size-12 place-items-center bg-frame-well"
                >
                  {slotSprite && <PixelSprite src={slotSprite} width={32} height={32} />}
                  <span className="sr-only">
                    {t('tools.slot', {
                      have: format.count(have),
                      need: format.count(input.quantity),
                      item: text.itemCount(input.itemId, input.quantity),
                    })}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'absolute right-0.5 bottom-0 text-[12px] leading-none font-extrabold text-parchment [text-shadow:0_1px_0_black]',
                      short && 'text-danger-soft',
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
                  aria-label={expanded ? t('tools.showFewer') : t('tools.showMore', { count: hidden })}
                  onClick={() => setExpanded((open) => !open)}
                  className="iron-slot grid size-12 place-items-center bg-frame-well text-[15px] font-extrabold text-parchment hover:brightness-125"
                >
                  {expanded ? '−' : `+${hidden}`}
                </button>
              </li>
            )}
          </ul>

          {working ? (
            <p className="py-2 text-[15px] font-extrabold">{t('tools.building')}</p>
          ) : (
            <WoodButton className="w-full" disabled={missing || pending} onClick={() => onBuild(recipe.id)}>
              {pending ? t('actions.starting') : t('tools.build')}
            </WoodButton>
          )}
        </>
      )}
    </article>
  )
}
