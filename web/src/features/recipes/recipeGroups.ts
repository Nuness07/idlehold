import type { GameAction, RecipeGroup } from '../../api/client'

export interface RecipeGroupData {
  id: string
  /** Whether any recipe is in the group yet. An empty group only shows what is coming. */
  open: boolean
}

/** The recipe groups of one trade, in the server's order; empty for a trade that does not split its recipes. */
export function recipeGroupsFor(skillId: string, groups: RecipeGroup[], actions: GameAction[]): RecipeGroupData[] {
  return groups
    .filter((group) => group.skillId === skillId)
    .map((group) => ({ id: group.id, open: actions.some((action) => action.groupId === group.id) }))
}

/**
 * The group a trade shows: the one the player picked, else the one holding the action being worked, else the
 * first with recipes. `undefined` for a trade without groups.
 */
export function shownRecipeGroup(
  groups: RecipeGroupData[],
  picked: string | undefined,
  activeGroupId: string | null | undefined,
): string | undefined {
  const open = groups.filter((group) => group.open)
  return [picked, activeGroupId, open[0]?.id].find((id) => id != null && open.some((group) => group.id === id)) ?? undefined
}
