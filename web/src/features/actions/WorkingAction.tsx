import type { ActiveAction, GameAction } from '../../api/client'
import { Button } from '../../components/Button'
import { PixelSprite } from '../../components/PixelSprite'
import { actionLabel, itemLabel } from '../../content/labels'
import { formatDuration } from '../../lib/format'
import { useCycleProgress } from './useCycleProgress'

interface WorkingActionProps {
  active: ActiveAction | null
  action: GameAction | undefined
  receivedAt: number
  onCycleComplete: () => void
  onStop: () => void
  stopping: boolean
}

/** The one action being worked right now. It owns the main column; everything else is quieter. */
export function WorkingAction({ active, action, receivedAt, onCycleComplete, onStop, stopping }: WorkingActionProps) {
  const barRef = useCycleProgress(active, receivedAt, onCycleComplete)

  if (!active || !action) {
    return (
      <section className="rounded-md border border-dashed border-ink/40 bg-limewash px-6 py-7">
        <h2 className="text-2xl font-extrabold">Nothing is being worked</h2>
        <p className="mt-1 text-muted">Pick an action below. It keeps going while you are away.</p>
      </section>
    )
  }

  const label = actionLabel(action.id)
  return (
    <section aria-labelledby="working-title" className="rounded-md border border-rule bg-white px-6 py-6 shadow-[0_1px_2px_rgb(27_23_18_/_0.06),0_8px_24px_-12px_rgb(27_23_18_/_0.18)]">
      <div className="flex flex-wrap items-center gap-4">
        {label.sprite ? (
          <PixelSprite src={label.sprite} width={32} height={32} scale={2} />
        ) : (
          <label.Icon aria-hidden className="size-8 text-ink" strokeWidth={1.75} />
        )}
        <h2 id="working-title" className="text-3xl leading-none font-extrabold">
          {label.verb}
        </h2>
      </div>

      <div
        ref={barRef}
        role="progressbar"
        aria-label={`${label.verb}, current cycle`}
        className="mt-5 h-3.5 overflow-hidden rounded-full bg-ochre-wash"
        style={{ ['--progress' as string]: '0' }}
      >
        <div className="h-full w-full origin-left scale-x-(--progress) rounded-full bg-ochre" />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <dl className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-[16px] font-medium text-muted sm:gap-x-7">
          <div className="flex gap-1.5"><dt className="sr-only">Cycle</dt><dd>Every {formatDuration(action.durationMs)}</dd></div>
          <div className="flex gap-1.5"><dt className="sr-only">Yield</dt><dd>+{action.outputQuantity} {itemLabel(action.outputItemId).toLowerCase()}</dd></div>
          <div className="flex gap-1.5"><dt className="sr-only">Experience</dt><dd>+{action.xpPerCompletion} XP</dd></div>
        </dl>
        <Button variant="quiet" className="ml-auto shrink-0" onClick={onStop} disabled={stopping}>
          {stopping ? 'Stopping…' : 'Stop'}
        </Button>
      </div>
    </section>
  )
}
