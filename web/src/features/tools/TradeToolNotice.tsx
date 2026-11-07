import { useTranslation } from 'react-i18next'
import { Button } from '../../components/Button'
import { PixelSprite } from '../../components/PixelSprite'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import type { TradeTool } from './tools'

interface TradeToolNoticeProps {
  tool: TradeTool
  /** Opens the trade that makes the missing tool. */
  onOpenTrade: (skillId: string) => void
}

/** Which tool a trade works with, or that it has none yet and where to make one. */
export function TradeToolNotice({ tool, onOpenTrade }: TradeToolNoticeProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const sprite = tool.kind === 'owned' ? itemSprite(tool.itemId) : undefined
  const makerSkillId = tool.kind === 'missing' ? tool.recipeSkillId : undefined

  return (
    <section
      aria-label={t('tools.tradeTool')}
      className="paper flex flex-wrap items-center gap-x-4 gap-y-3 rounded-sm px-4 py-3"
    >
      <span aria-hidden className="grid size-12 shrink-0 place-items-center border-2 border-ink bg-limewash">
        {sprite && <PixelSprite src={sprite} width={32} height={32} />}
      </span>
      {tool.kind === 'owned' ? (
        <p className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold tracking-[0.14em] text-muted uppercase">{t('tools.inUse')}</span>
          <span className="text-lg leading-tight font-extrabold">{text.itemName(tool.itemId)}</span>
        </p>
      ) : (
        <>
          <p className="min-w-0 flex-1 basis-40 text-[15px] font-medium text-muted">{t('tools.noneYet')}</p>
          {makerSkillId && (
            <Button variant="quiet" onClick={() => onOpenTrade(makerSkillId)}>
              {t('tools.goMake', { trade: text.tradeName(makerSkillId) })}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
