import { useTranslation } from 'react-i18next'
import { PixelSprite } from '../../components/PixelSprite'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'

interface TradeToolNoticeProps {
  /** The tool the trade works with. */
  itemId: string
}

/** The tool a trade works with. A trade without its tool is locked instead (`TradeLock`). */
export function TradeToolNotice({ itemId }: TradeToolNoticeProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const sprite = itemSprite(itemId)

  return (
    <section
      aria-label={t('tools.tradeTool')}
      className="paper flex flex-wrap items-center gap-x-4 gap-y-3 rounded-sm px-4 py-3"
    >
      <span aria-hidden className="grid size-12 shrink-0 place-items-center border-2 border-ink bg-limewash">
        {sprite && <PixelSprite src={sprite} width={32} height={32} />}
      </span>
      <p className="min-w-0 flex-1">
        <span className="block text-xs font-extrabold tracking-[0.14em] text-muted uppercase">{t('tools.inUse')}</span>
        <span className="text-lg leading-tight font-extrabold">{text.itemName(itemId)}</span>
      </p>
    </section>
  )
}
