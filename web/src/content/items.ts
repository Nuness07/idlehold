import type { Content } from '../api/client'

/**
 * Every item the content knows, in the order the game lists them: trade by trade, action by action, each
 * action's output before its inputs. The content has no item list of its own: an item is anything an
 * action makes or uses. Tools are items too.
 */
export function itemIdsIn(content: Content): string[] {
  const ids = new Set<string>()
  for (const action of content.actions) {
    ids.add(action.outputItemId)
    for (const input of action.inputs) ids.add(input.itemId)
  }
  return [...ids]
}
