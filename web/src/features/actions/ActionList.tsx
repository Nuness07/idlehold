import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GameAction } from '../../api/client'
import { Button } from '../../components/Button'
import { PixelSprite } from '../../components/PixelSprite'
import { actionLabel, tradeLabel } from '../../content/labels'
import { useContentText } from '../../content/text'
import { formatDuration } from '../../lib/format'
import { cn } from '../../lib/cn'

interface ActionListProps {
  actions: GameAction[]
  activeActionId: string | undefined
  pendingActionId: string | undefined
  /** The player's level in the trade: an action that needs more stays locked, showing the level it opens at. */
  level: number
  onStart: (actionId: string) => void
}

/** Every action of the selected trade. The working one recedes here: it already owns the panel above. */
export function ActionList({ actions, activeActionId, pendingActionId, level, onStart }: ActionListProps) {
  const { t } = useTranslation()
  const text = useContentText()

  return (
    <section aria-labelledby="actions-title">
      <h2 id="actions-title" className="mb-3 text-xs font-extrabold tracking-[0.14em] text-parchment uppercase">
        {t('actions.heading')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const label = actionLabel(action.id)
          const working = action.id === activeActionId
          const pending = action.id === pendingActionId
          const locked = action.requiredLevel > level
          return (
            <li
              key={action.id}
              className={cn(
                'flex items-center gap-4 rounded-md border px-4 py-4',
                working ? 'border-ochre bg-ochre-wash' : 'border-rule bg-limewash',
                locked && 'bg-stone',
              )}
            >
              {label.sprite ? (
                <PixelSprite src={label.sprite} width={32} height={32} scale={2} className={cn(locked && 'opacity-40 grayscale')} />
              ) : (
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded text-oxblood-ink"
                  style={{ backgroundColor: tradeLabel(action.skillId).paint }}
                >
                  <label.Icon className="size-6" strokeWidth={1.75} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-tight font-extrabold">{text.actionName(action.id)}</p>
                <p className="text-[15px] text-muted">
                  {t('actions.meta', {
                    time: formatDuration(action.durationMs),
                    quantity: action.outputQuantity,
                    item: text.itemCount(action.outputItemId, action.outputQuantity),
                    xp: action.xpPerCompletion,
                  })}
                </p>
                {action.inputs.length > 0 && (
                  <p className="text-[15px] text-muted">
                    {t('actions.uses', {
                      items: action.inputs
                        .map((input) => `${input.quantity} ${text.itemCount(input.itemId, input.quantity)}`)
                        .join(', '),
                    })}
                  </p>
                )}
              </div>
              {locked ? (
                <span className="flex shrink-0 items-center gap-1.5 text-[15px] font-extrabold text-muted">
                  <Lock aria-hidden className="size-4" strokeWidth={2.5} />
                  {t('actions.level', { level: action.requiredLevel })}
                </span>
              ) : working ? (
                <span className="shrink-0 text-[15px] font-extrabold">{t('actions.working')}</span>
              ) : (
                <Button className="shrink-0" onClick={() => onStart(action.id)} disabled={pending}>
                  {pending ? t('actions.starting') : activeActionId ? t('actions.switch') : t('actions.start')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
