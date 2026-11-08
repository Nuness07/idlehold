import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PixelSprite } from '../../components/PixelSprite'
import { menuIcon, type MenuScreen } from './menu'

interface ScreenPageProps {
  screen: MenuScreen | 'settings'
  children: ReactNode
}

/** A screen opened from the hold menu, filling the middle column under its icon and title. */
export function ScreenPage({ screen, children }: ScreenPageProps) {
  const { t } = useTranslation()

  return (
    <main
      aria-labelledby="screen-title"
      className="flex w-full max-w-[880px] min-w-0 flex-col gap-6 justify-self-center px-4 pt-6 pb-10 sm:px-8 lg:px-10"
    >
      <h1 id="screen-title" className="flex items-center gap-3 text-[28px] font-extrabold text-parchment">
        <PixelSprite src={menuIcon[screen]} width={32} height={32} scale={2} />
        {t(`menu.${screen}`)}
      </h1>
      {children}
    </main>
  )
}

/** A screen whose feature is not built yet: what it will hold, on a pinned paper. */
export function ComingSoon({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="paper max-w-xl rounded px-5 py-4">
      <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">{t('comingSoon.label')}</p>
      <p className="mt-1.5 text-[16px] leading-snug">{children}</p>
    </div>
  )
}
