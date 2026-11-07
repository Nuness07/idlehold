import { useTranslation } from 'react-i18next'
import type { Account } from '../../api/client'
import { PixelSprite } from '../../components/PixelSprite'
import { cn } from '../../lib/cn'
import { menuIcon, menuScreens, type MenuScreen, type Screen } from './menu'
import { ProfileCard } from './ProfileCard'

interface SideMenuProps {
  /** The screen in the middle; its menu entry shows as pressed. */
  screen: Screen
  onOpen: (screen: MenuScreen | 'settings') => void
  account: Account
  onSaveProgress: () => void
}

/**
 * The hold menu on wide screens: a column of gold-trimmed plaques that open screens in the middle,
 * with the profile card at the foot of the panel.
 */
export function SideMenu({ screen, onOpen, account, onSaveProgress }: SideMenuProps) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('menu.heading')} className="flex h-full flex-col gap-8 py-2">
      <ul className="flex flex-col gap-2">
        {menuScreens.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onOpen(id)}
              aria-pressed={screen === id}
              className="menu-plaque flex w-full items-center gap-3 text-left text-[16px] font-bold"
            >
              <PixelSprite src={menuIcon[id]} width={32} height={32} />
              <span>{t(`menu.${id}`)}</span>
            </button>
          </li>
        ))}
      </ul>
      <ProfileCard
        className="mt-auto"
        account={account}
        settingsOpen={screen === 'settings'}
        onOpenSettings={() => onOpen('settings')}
        onSaveProgress={onSaveProgress}
      />
    </nav>
  )
}

/** The hold menu on phones and tablets: a bar fixed to the bottom of the screen, icons over short labels. */
export function MenuBar({ screen, onOpen }: Pick<SideMenuProps, 'screen' | 'onOpen'>) {
  const { t } = useTranslation()
  const entries = [...menuScreens, 'settings'] as const

  return (
    <nav
      aria-label={t('menu.heading')}
      className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ochre/70 bg-oxblood text-oxblood-ink shadow-[0_-4px_16px_rgb(0_0_0/0.45)]"
    >
      <ul className="mx-auto flex max-w-xl justify-between px-2">
        {entries.map((id) => (
          <li key={id} className="flex-1">
            <button
              type="button"
              onClick={() => onOpen(id)}
              aria-pressed={screen === id}
              className={cn(
                'flex w-full flex-col items-center gap-0.5 py-1.5 text-[12px] font-bold text-oxblood-soft transition-colors',
                'hover:text-oxblood-ink aria-pressed:bg-black/20 aria-pressed:text-oxblood-ink',
              )}
            >
              <PixelSprite src={menuIcon[id]} width={32} height={32} />
              <span>{t(`menu.${id}`)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
