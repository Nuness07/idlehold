import { useTranslation } from 'react-i18next'
import type { GameAction } from '../../api/client'
import { MaterialSlots } from '../../components/MaterialSlots'
import { WoodButton } from '../../components/WoodButton'
import { useContentText } from '../../content/text'

export interface CampfireGoal {
  /** What lighting it takes from the stores, as the server says. */
  cost: GameAction['inputs']
  /** The trade the lit campfire opens. */
  opensSkillId: string | undefined
  inventory: Record<string, number>
  lighting: boolean
  onLight: () => void
}

/**
 * The village's first goal, pinned over the cold campfire until it is lit: what it takes, what it opens and a
 * button to light it. Whether it can be lit is the server's call; the stores only decide how the slots and button
 * look.
 */
export function CampfirePopup({ cost, opensSkillId, inventory, lighting, onLight }: CampfireGoal) {
  const { t } = useTranslation()
  const text = useContentText()
  const missing = cost.some((item) => (inventory[item.itemId] ?? 0) < item.quantity)

  return (
    <section aria-labelledby="campfire-goal" className="flex flex-col items-center drop-shadow-[0_4px_0_rgb(0_0_0/0.45)]">
      <div className="popup-frame flex w-max max-w-[260px] flex-col items-center gap-2 bg-parchment px-1 py-0.5 text-center">
        <h2 id="campfire-goal" className="text-lg leading-tight font-extrabold">
          {text.buildingAction('campfire')}
        </h2>
        {opensSkillId && (
          <p className="text-[14px] leading-tight text-muted">{t('village.build.opens', { trade: text.tradeName(opensSkillId) })}</p>
        )}
        <MaterialSlots inputs={cost} inventory={inventory} className="justify-center" />
        <WoodButton className="mt-1" disabled={missing || lighting} onClick={onLight}>
          {lighting ? t('village.build.lighting') : t('village.build.light')}
        </WoodButton>
      </div>
      {/* The tail points down at the fire, on the art grid: a 5-step pixel triangle. */}
      <svg aria-hidden viewBox="0 0 9 5" className="-mt-px h-[15px] w-[27px] text-frame-well" shapeRendering="crispEdges">
        <path fill="currentColor" d="M0 0h9v1h-1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h-1z" />
      </svg>
    </section>
  )
}
