import { itemLabel } from '../../content/labels'
import { formatCount } from '../../lib/format'

interface StoresProps {
  inventory: Record<string, number>
  /** Item that just received a confirmed reward, highlighted briefly. */
  freshItemId: string | undefined
}

/** Everything the hold has stored. */
export function Stores({ inventory, freshItemId }: StoresProps) {
  const entries = Object.entries(inventory).sort(([, a], [, b]) => b - a)

  return (
    <section aria-labelledby="stores-title" className="px-6 py-6 lg:max-w-[880px] lg:px-10 xl:max-w-none xl:px-6">
      <h2 id="stores-title" className="mb-3 text-xs font-extrabold tracking-[0.14em] text-muted uppercase">
        Stores
      </h2>
      {entries.length === 0 ? (
        <p className="text-muted">Nothing stored yet. Start an action and the stores fill up, even while you are away.</p>
      ) : (
        <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-1">
          {entries.map(([itemId, count]) => (
            <li key={itemId} className="flex items-baseline justify-between gap-4 border-t border-rule py-3">
              <span className="text-[16px]">{itemLabel(itemId)}</span>
              <span
                className={`text-xl font-extrabold tabular-nums transition-colors duration-700 ${
                  itemId === freshItemId ? 'text-verdigris' : 'text-ink'
                }`}
              >
                {formatCount(count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
