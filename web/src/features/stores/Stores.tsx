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

/** Everything the hold has stored. */
export function Stores({ inventory, freshItemId }: StoresProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const entries = Object.entries(inventory).sort(([, a], [, b]) => b - a)

  return (
    <section aria-labelledby="stores-title" className="py-2">
      <h2 id="stores-title" className="mb-3 px-1 text-xs font-extrabold tracking-[0.14em] text-parchment uppercase">
        {t('stores.heading')}
      </h2>
      {entries.length === 0 ? (
        <p className="paper rounded px-3 py-2.5 text-muted">{t('stores.empty')}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
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
      )}
    </section>
  )
}
