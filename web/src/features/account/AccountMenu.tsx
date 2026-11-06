import { LogOut, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Account } from '../../api/client'

interface AccountMenuProps {
  account: Account | null
  onSaveProgress: () => void
  onSignOut: () => void
  signingOut: boolean
}

const bandButton =
  'inline-flex min-h-9 items-center gap-2 rounded border border-oxblood-soft/40 px-3 text-[14px] font-bold text-oxblood-ink transition-colors hover:bg-oxblood-ink/10 focus-visible:outline-oxblood-ink disabled:opacity-60'

/** The account controls on the oxblood band: "Save progress" for a guest, the e-mail and "Sign out" when signed in. */
export function AccountMenu({ account, onSaveProgress, onSignOut, signingOut }: AccountMenuProps) {
  const { t } = useTranslation()

  if (!account) {
    return (
      <button type="button" onClick={onSaveProgress} title={t('account.saveProgress')} className={bandButton}>
        <Save aria-hidden className="size-4" />
        <span className="sr-only sm:not-sr-only">{t('account.saveProgress')}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[220px] truncate text-[14px] text-oxblood-soft md:inline" title={account.email}>
        {t('account.signedInAs', { email: account.email })}
      </span>
      <button type="button" onClick={onSignOut} disabled={signingOut} title={t('account.signOut')} className={bandButton}>
        <LogOut aria-hidden className="size-4" />
        <span className="sr-only sm:not-sr-only">{t('account.signOut')}</span>
      </button>
    </div>
  )
}
