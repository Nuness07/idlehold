import { useTranslation } from 'react-i18next'
import { PixelSprite } from '../../components/PixelSprite'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { useFormat } from '../../lib/format'

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
    <section aria-labelledby="stores-title" className="px-6 py-6 lg:max-w-[880px] lg:px-10 xl:max-w-none xl:px-6">
      <h2 id="stores-title" className="mb-3 text-xs font-extrabold tracking-[0.14em] text-muted uppercase">
        {t('stores.heading')}
      </h2>
      {entries.length === 0 ? (
        <p className="text-muted">{t('stores.empty')}</p>
      ) : (
        <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-1">
          {entries.map(([itemId, count]) => {
            const sprite = itemSprite(itemId)
            return (
              <li key={itemId} className="flex items-center justify-between gap-4 border-t border-rule py-2">
                <span className="flex items-center gap-3 text-[16px]">
                  {sprite && <PixelSprite src={sprite} width={32} height={32} />}
                  {text.itemName(itemId)}
                </span>
                <span
                  className={`text-xl font-extrabold tabular-nums transition-colors duration-700 ${
                    itemId === freshItemId ? 'text-verdigris' : 'text-ink'
                  }`}
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
