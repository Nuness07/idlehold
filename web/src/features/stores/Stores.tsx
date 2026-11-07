import { useTranslation } from 'react-i18next'
import { PixelSprite } from '../../components/PixelSprite'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { useFormat } from '../../lib/format'
import { cn } from '../../lib/cn'

interface StoresProps {
  inventory: Record<string, number>
  /** Item that just received a confirmed reward, highlighted briefly. */
  freshItemId: string | undefined
}

/** Everything the hold has stored, shown on the Storehouse screen. */
export function Stores({ inventory, freshItemId }: StoresProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const entries = Object.entries(inventory).sort(([, a], [, b]) => b - a)

  return entries.length === 0 ? (
    <p className="paper max-w-xl rounded px-4 py-3 text-muted">{t('stores.empty')}</p>
  ) : (
    <ul aria-label={t('stores.heading')} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map(([itemId, count]) => {
        const sprite = itemSprite(itemId)
        return (
          <li key={itemId} className="paper flex items-center justify-between gap-4 rounded px-3 py-1.5">
            <span className="flex items-center gap-3 text-[16px]">
              {sprite && <PixelSprite src={sprite} width={32} height={32} />}
              {text.itemName(itemId)}
            </span>
            <span
              className={cn(
                'text-xl font-extrabold tabular-nums transition-colors duration-700',
                itemId === freshItemId ? 'text-verdigris' : 'text-ink',
              )}
            >
              {format.count(count)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
