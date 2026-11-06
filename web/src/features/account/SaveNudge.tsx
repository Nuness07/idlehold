import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/Button'

interface SaveNudgeProps {
  onCreateAccount: () => void
  onDismiss: () => void
}

/** A quiet invitation to create an account, shown to a guest who has progress worth keeping. */
export function SaveNudge({ onCreateAccount, onDismiss }: SaveNudgeProps) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={t('account.saveProgress')}
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-rule bg-white px-5 py-4"
    >
      <p className="min-w-0 flex-1 basis-64 text-[16px] leading-snug">{t('account.nudge.body')}</p>
      <div className="flex items-center gap-2">
        <Button onClick={onCreateAccount}>{t('account.nudge.action')}</Button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('account.nudge.dismiss')}
          className="grid size-9 place-items-center rounded text-muted hover:bg-ink/5 hover:text-ink"
        >
          <X className="size-5" />
        </button>
      </div>
    </section>
  )
}
