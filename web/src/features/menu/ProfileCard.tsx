import { UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Account } from '../../api/client'
import { PixelSprite } from '../../components/PixelSprite'
import { cn } from '../../lib/cn'
import { menuIcon } from './menu'

interface ProfileCardProps {
  account: Account
  settingsOpen: boolean
  onOpenSettings: () => void
  onSaveProgress: () => void
  className?: string
}

/**
 * Who is playing: the account's e-mail, or "Guest" with a way to save progress.
 * The gear opens the settings screen, where the language and signing out live.
 */
export function ProfileCard({ account, settingsOpen, onOpenSettings, onSaveProgress, className }: ProfileCardProps) {
  const { t } = useTranslation()
  const name = account.isGuest ? t('profile.guest') : (account.email ?? '')

  return (
    <section aria-label={name} className={cn('paper flex flex-col gap-2.5 rounded px-3 py-3', className)}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-oxblood text-oxblood-soft">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold" title={name}>
            {name}
          </p>
          <p className="text-[13px] text-muted">{account.isGuest ? t('profile.guestNote') : t('profile.signedIn')}</p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-pressed={settingsOpen}
          aria-label={t('menu.settings')}
          title={t('menu.settings')}
          className="grid size-11 shrink-0 place-items-center rounded transition-colors hover:bg-ink/10 aria-pressed:bg-ink/15"
        >
          <PixelSprite src={menuIcon.settings} width={32} height={32} />
        </button>
      </div>
      {account.isGuest && (
        <button
          type="button"
          onClick={onSaveProgress}
          className="min-h-9 rounded bg-oxblood px-3 text-[14px] font-bold text-oxblood-ink transition-colors hover:bg-oxblood/90"
        >
          {t('account.saveProgress')}
        </button>
      )}
    </section>
  )
}
