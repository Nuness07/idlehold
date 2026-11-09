import { useTranslation } from 'react-i18next'
import type { Fuel } from '../../api/client'
import campfire from '../../assets/village/campfire.png'
import { PixelSprite } from '../../components/PixelSprite'
import { itemSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'

interface FirePanelProps {
  /** Every fuel, in the order the server lists them. */
  fuels: Fuel[]
  inventory: Record<string, number>
  /** Dishes the fire can still cook from what is already in it, as the server says. */
  fireCyclesLeft: number
  /** The fuel the next dish will burn. */
  selected: string
  /** Whether a dish is on the fire right now. */
  burning: boolean
  onSelect: (itemId: string) => void
}

/**
 * The fire a trade cooks on: what is left in it and the fuel it takes from the stores next. The fire only burns
 * while a dish cooks, and takes a whole fuel each time the last one runs out.
 */
export function FirePanel({ fuels, inventory, fireCyclesLeft, selected, burning, onSelect }: FirePanelProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const lit = burning || fireCyclesLeft > 0

  return (
    <section aria-labelledby="fire-title" className="paper flex flex-col gap-4 rounded-sm px-4 py-4">
      <div className="flex items-center gap-4">
        <PixelSprite
          src={campfire}
          width={41}
          height={32}
          scale={2}
          className={cn('shrink-0', !lit && 'opacity-60 grayscale')}
        />
        <div className="min-w-0">
          <h2 id="fire-title" className="text-lg leading-tight font-extrabold">
            {t('fire.heading')}
          </h2>
          <p className="text-[15px] text-muted">
            {fireCyclesLeft > 0 ? t('fire.left', { count: fireCyclesLeft }) : burning ? t('fire.burning') : t('fire.out')}
          </p>
        </div>
      </div>

      <fieldset className="min-w-0 flex-1">
        <legend className="mb-2 text-xs font-extrabold tracking-[0.14em] text-muted uppercase">{t('fire.fuel')}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {fuels.map((fuel) => {
            const sprite = itemSprite(fuel.itemId)
            const owned = inventory[fuel.itemId] ?? 0
            const chosen = fuel.itemId === selected
            return (
              <label
                key={fuel.itemId}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded border-2 px-2 py-1.5 has-focus-visible:outline-2 has-focus-visible:outline-ink',
                  chosen ? 'border-ochre bg-ochre-wash' : 'border-rule bg-limewash',
                  owned === 0 && !chosen && 'opacity-60',
                )}
              >
                <input
                  type="radio"
                  name="fuel"
                  value={fuel.itemId}
                  checked={chosen}
                  onChange={() => onSelect(fuel.itemId)}
                  className="sr-only"
                />
                {sprite && <PixelSprite src={sprite} width={32} height={32} className="shrink-0" />}
                <span className="min-w-0 leading-tight">
                  <span className="block font-extrabold">{text.itemName(fuel.itemId)}</span>
                  <span className="block text-[13px] text-muted">
                    {t('fire.fuelMeta', { owned, count: fuel.cycles })}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}
