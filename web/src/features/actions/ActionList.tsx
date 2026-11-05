import type { GameAction } from '../../api/client'
import { Button } from '../../components/Button'
import { PixelSprite } from '../../components/PixelSprite'
import { actionLabel, itemLabel, tradeLabel } from '../../content/labels'
import { formatDuration } from '../../lib/format'

interface ActionListProps {
  actions: GameAction[]
  activeActionId: string | undefined
  pendingActionId: string | undefined
  onStart: (actionId: string) => void
}

/** Every action of the selected trade. The working one recedes here: it already owns the panel above. */
export function ActionList({ actions, activeActionId, pendingActionId, onStart }: ActionListProps) {
  return (
    <section aria-labelledby="actions-title">
      <h2 id="actions-title" className="mb-3 text-xs font-extrabold tracking-[0.14em] text-muted uppercase">
        Actions
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const label = actionLabel(action.id)
          const working = action.id === activeActionId
          const pending = action.id === pendingActionId
          return (
            <li
              key={action.id}
              className={`flex items-center gap-4 rounded-md border px-4 py-4 ${
                working ? 'border-ochre bg-ochre-wash' : 'border-rule bg-limewash'
              }`}
            >
              {label.sprite ? (
                <PixelSprite src={label.sprite} width={32} height={32} scale={2} />
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
                <p className="text-lg leading-tight font-extrabold">{label.name}</p>
                <p className="text-[15px] text-muted">
                  {formatDuration(action.durationMs)} · {action.outputQuantity} {itemLabel(action.outputItemId).toLowerCase()} · {action.xpPerCompletion} XP
                </p>
              </div>
              {working ? (
                <span className="shrink-0 text-[15px] font-extrabold">Working</span>
              ) : (
                <Button className="shrink-0" onClick={() => onStart(action.id)} disabled={pending}>
                  {pending ? 'Starting…' : activeActionId ? 'Switch' : 'Start'}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
