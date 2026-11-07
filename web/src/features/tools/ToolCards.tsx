import { useTranslation } from 'react-i18next'
import { ToolCard } from './ToolCard'
import type { ToolCardData } from './tools'

interface ToolCardsProps {
  cards: ToolCardData[]
  inventory: Record<string, number>
  activeActionId: string | undefined
  pendingActionId: string | undefined
  onBuild: (actionId: string) => void
}

/** The tools a trade makes: one card per family, always showing the next tier. */
export function ToolCards({ cards, inventory, activeActionId, pendingActionId, onBuild }: ToolCardsProps) {
  const { t } = useTranslation()
  if (cards.length === 0) return null

  return (
    <section aria-labelledby="tools-title">
      <h2 id="tools-title" className="mb-3 text-xs font-extrabold tracking-[0.14em] text-parchment uppercase">
        {t('tools.heading')}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {cards.map((card) => (
          <li key={card.family}>
            <ToolCard
              itemId={card.itemId}
              recipe={card.recipe}
              inventory={inventory}
              working={card.recipe !== undefined && card.recipe.id === activeActionId}
              pending={card.recipe !== undefined && card.recipe.id === pendingActionId}
              onBuild={onBuild}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
