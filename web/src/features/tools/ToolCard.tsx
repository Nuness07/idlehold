import { useTranslation } from 'react-i18next'
import type { GameAction } from '../../api/client'
import { MaterialSlots } from '../../components/MaterialSlots'
import { PixelSprite } from '../../components/PixelSprite'
import { WoodButton } from '../../components/WoodButton'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { useFormat } from '../../lib/format'

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
 * One tool family: the tool in an iron frame, its name, a slot per material and a button to build it.
 * Whether it can be built is the server's call; the stores only decide how the slots and button look.
 */
export function ToolCard({ itemId, recipe, inventory, working, pending, onBuild }: ToolCardProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()

  const sprite = itemSprite(itemId)
  const inputs = recipe?.inputs ?? []
  const missing = inputs.some((input) => (inventory[input.itemId] ?? 0) < input.quantity)
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
          <MaterialSlots inputs={inputs} inventory={inventory} className="justify-center" />

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
