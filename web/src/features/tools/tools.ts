import type { GameAction, ToolDefinition, ToolProgress } from '../../api/client'

export interface ToolCardData {
  family: string
  /** The tool shown: the next tier to make, or the best one owned when nothing better exists. */
  itemId: string
  /** The recipe for the next tier; `undefined` once the family is at its best tool. */
  recipe: GameAction | undefined
}

/**
 * The tool cards of one trade, from what the server says comes next in each family. A family appears in
 * the trade whose recipe makes its tools; a family with neither an owned tool nor a recipe shows nothing.
 */
export function toolCardsFor(skillId: string, tools: ToolProgress[], actions: GameAction[]): ToolCardData[] {
  const byId = new Map(actions.map((action) => [action.id, action]))
  const cards: ToolCardData[] = []

  for (const tool of tools) {
    const recipe = tool.nextActionId ? byId.get(tool.nextActionId) : undefined
    const itemId = recipe?.outputItemId ?? tool.ownedItemId
    const madeIn = recipe ?? actions.find((action) => action.outputItemId === tool.ownedItemId)
    if (itemId && madeIn?.skillId === skillId) {
      cards.push({ family: tool.family, itemId, recipe })
    }
  }

  return cards
}

export type TradeTool =
  /** The trade's tool family has a tool in the stores. */
  | { kind: 'owned'; itemId: string }
  /** The trade uses a tool the player has not made yet; `recipeSkillId` is the trade that makes it. */
  | { kind: 'missing'; recipeSkillId: string | undefined }

/**
 * The tool a trade works with, from the catalog (which trade each tool serves) and the server's progress.
 * `null` when no tool serves the trade.
 */
export function tradeToolFor(
  skillId: string,
  catalog: ToolDefinition[],
  tools: ToolProgress[],
  actions: GameAction[],
): TradeTool | null {
  const family = catalog.find((tool) => tool.skillId === skillId)?.family
  if (!family) return null

  const progress = tools.find((tool) => tool.family === family)
  if (progress?.ownedItemId) return { kind: 'owned', itemId: progress.ownedItemId }

  const recipe = actions.find((action) => action.id === progress?.nextActionId)
  return { kind: 'missing', recipeSkillId: recipe?.skillId }
}
