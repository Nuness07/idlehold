import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

/** Readable fallback for an id the translation files do not know yet ("copper-ore" → "Copper ore"). */
export function humanize(id: string): string {
  const words = id.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Content ids come from the server, so their keys are built at runtime. This cast is the one place
// where translation keys are not checked at compile time; the fallback covers unknown ids.
type UntypedT = (key: string, options: Record<string, unknown>) => string

export function contentText(t: TFunction) {
  const untyped = t as unknown as UntypedT
  const lookup = (key: string, fallback: string, options: Record<string, unknown> = {}) =>
    untyped(key, { defaultValue: fallback, ...options })

  return {
    tradeName: (skillId: string) => lookup(`content.trades.${skillId}`, humanize(skillId)),
    actionName: (actionId: string) => lookup(`content.actions.${actionId}.name`, humanize(actionId)),
    actionVerb: (actionId: string) => lookup(`content.actions.${actionId}.verb`, humanize(actionId)),
    buildingName: (buildingId: string) => lookup(`content.buildings.${buildingId}.name`, humanize(buildingId)),
    /** What the player does to build it, as a call to action: "Light the campfire". */
    buildingAction: (buildingId: string) => lookup(`content.buildings.${buildingId}.action`, humanize(buildingId)),
    recipeGroupName: (groupId: string) => lookup(`content.recipeGroups.${groupId}`, humanize(groupId)),
    /** What a trade's recipe groups are, as a heading: "Station" in Cooking, "Material" in Crafting. */
    recipeGroupLegend: (skillId: string) => lookup(`recipeGroups.legend.${skillId}`, ''),
    itemName: (itemId: string) => lookup(`content.items.${itemId}.name`, humanize(itemId)),
    /** The item as it reads after a number: "1 pine log", "9 pine logs", "9 percas". */
    itemCount: (itemId: string, count: number) =>
      lookup(`content.items.${itemId}.count`, humanize(itemId).toLowerCase(), { count }),
  }
}

/** Content names in the current language. Components re-render when the language changes. */
export function useContentText() {
  const { t } = useTranslation()
  return contentText(t)
}
