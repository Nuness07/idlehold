import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import lockChains from '../../assets/frames/lock-chains.png'
import { PixelSprite } from '../../components/PixelSprite'
import { WoodButton } from '../../components/WoodButton'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'

interface TradeLockProps {
  /** The tool that opens the trade, as the server says. */
  toolItemId: string
  /** The trade whose recipe makes that tool, if any. */
  makerSkillId: string | undefined
  onOpenTrade: (skillId: string) => void
  /** The trade's content, shown dimmed behind the chains and out of reach. */
  children: ReactNode
}

/**
 * A trade the player cannot work yet: its actions sit behind crossed chains and a padlock, out of reach
 * (`inert`, so they cannot be clicked or focused), and a plaque on the padlock names the tool that opens it.
 */
export function TradeLock({ toolItemId, makerSkillId, onOpenTrade, children }: TradeLockProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const sprite = itemSprite(toolItemId)

  return (
    <section aria-label={t('tools.lockedUntil')} className="relative min-h-[360px]">
      <div inert className="opacity-30 grayscale-[0.7] select-none">
        {children}
      </div>

      <div className="absolute inset-x-0 top-6 flex flex-col items-center">
        <PixelSprite src={lockChains} width={58} height={57} scale={3} className="drop-shadow-[0_6px_0_rgb(0_0_0/0.45)]" />
        <p className="lock-plaque -mt-6 flex flex-col items-center gap-1 drop-shadow-[0_4px_0_rgb(0_0_0/0.45)]">
          <span className="text-xs font-extrabold tracking-[0.14em] uppercase opacity-75">{t('tools.lockedUntil')}</span>
          <span className="flex items-center gap-2 text-lg leading-tight font-extrabold">
            {sprite && <PixelSprite src={sprite} width={32} height={32} />}
            {text.itemName(toolItemId)}
          </span>
        </p>
        {makerSkillId && (
          <WoodButton className="mt-4 px-2" onClick={() => onOpenTrade(makerSkillId)}>
            {t('tools.goMake', { trade: text.tradeName(makerSkillId) })}
          </WoodButton>
        )}
      </div>
    </section>
  )
}
