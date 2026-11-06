import { useTranslation } from 'react-i18next'
import type { ActiveAction, GameAction } from '../../api/client'
import { Button } from '../../components/Button'
import { PixelSprite } from '../../components/PixelSprite'
import { actionLabel } from '../../content/labels'
import { useContentText } from '../../content/text'
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
  const { t } = useTranslation()
  const text = useContentText()
  const barRef = useCycleProgress(active, receivedAt, onCycleComplete)

  if (!active || !action) {
    return (
      <section className="rounded-md border border-dashed border-ink/40 bg-limewash px-6 py-7">
        <h2 className="text-2xl font-extrabold">{t('working.idleTitle')}</h2>
        <p className="mt-1 text-muted">{t('working.idleBody')}</p>
      </section>
    )
  }

  const label = actionLabel(action.id)
  const verb = text.actionVerb(action.id)
  return (
    <section aria-labelledby="working-title" className="rounded-md border border-rule bg-white px-6 py-6 shadow-[0_1px_2px_rgb(27_23_18_/_0.06),0_8px_24px_-12px_rgb(27_23_18_/_0.18)]">
      <div className="flex flex-wrap items-center gap-4">
        {label.sprite ? (
          <PixelSprite src={label.sprite} width={32} height={32} scale={2} />
        ) : (
          <label.Icon aria-hidden className="size-8 text-ink" strokeWidth={1.75} />
        )}
        <h2 id="working-title" className="text-3xl leading-none font-extrabold">
          {verb}
        </h2>
      </div>

      <div
        ref={barRef}
        role="progressbar"
        aria-label={t('working.progressLabel', { verb })}
        className="mt-5 h-3.5 overflow-hidden rounded-full bg-ochre-wash"
        style={{ ['--progress' as string]: '0' }}
      >
        <div className="h-full w-full origin-left scale-x-(--progress) rounded-full bg-ochre" />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <dl className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-[16px] font-medium text-muted sm:gap-x-7">
          <div className="flex gap-1.5">
            <dt className="sr-only">{t('working.cycle')}</dt>
            <dd>{t('working.every', { time: formatDuration(action.durationMs) })}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="sr-only">{t('working.yield')}</dt>
            <dd>
              {t('working.output', {
                quantity: action.outputQuantity,
                item: text.itemCount(action.outputItemId, action.outputQuantity),
              })}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="sr-only">{t('working.experience')}</dt>
            <dd>{t('working.xp', { xp: action.xpPerCompletion })}</dd>
          </div>
        </dl>
        <Button variant="quiet" className="ml-auto shrink-0" onClick={onStop} disabled={stopping}>
          {stopping ? t('working.stopping') : t('working.stop')}
        </Button>
      </div>
    </section>
  )
}
