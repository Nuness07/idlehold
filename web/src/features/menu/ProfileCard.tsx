import { useTranslation } from 'react-i18next'
import type { Account } from '../../api/client'
import { PixelSprite } from '../../components/PixelSprite'
import { WoodButton } from '../../components/WoodButton'
import { cn } from '../../lib/cn'
import crest from '../../assets/menu/crest.png'
import { menuIcon } from './menu'

interface ProfileCardProps {
  account: Account
  settingsOpen: boolean
  onOpenSettings: () => void
  onSaveProgress: () => void
  className?: string
}

/**
 * Who is playing, on a gold-trimmed navy nameplate: the hold's crest, the account's e-mail or "Guest"
 * with a way to save progress. The gear opens the settings screen, where the language and signing out live.
 */
export function ProfileCard({ account, settingsOpen, onOpenSettings, onSaveProgress, className }: ProfileCardProps) {
  const { t } = useTranslation()
  const name = account.isGuest ? t('profile.guest') : (account.email ?? '')

  return (
    <section aria-label={name} className={cn('profile-plate flex flex-col gap-3', className)}>
      <div className="-mx-1 flex items-center gap-2.5">
        <PixelSprite src={crest} width={32} height={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-parchment" title={name}>
            {name}
          </p>
          <p className="text-[13px] leading-tight text-oxblood-soft">
            {account.isGuest ? t('profile.guestNote') : t('profile.signedIn')}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-pressed={settingsOpen}
          aria-label={t('menu.settings')}
          title={t('menu.settings')}
          className="grid size-10 shrink-0 place-items-center rounded transition-[filter,background-color] hover:brightness-125 aria-pressed:bg-black/25"
        >
          <PixelSprite src={menuIcon.settings} width={32} height={32} />
        </button>
      </div>
      {account.isGuest && (
        <WoodButton className="wood-button-small text-[14px]" onClick={onSaveProgress}>
          {t('account.saveProgress')}
        </WoodButton>
      )}
    </section>
  )
}
