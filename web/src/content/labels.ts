import { Axe, TreeDeciduous, TreePine, type LucideIcon } from 'lucide-react'
import birchTree from '../assets/actions/birch-tree.png'
import pineTree from '../assets/actions/pine-tree.png'
import woodcuttingEmblem from '../assets/emblems/woodcutting.png'
import birchLog from '../assets/items/birch-log.png'
import pineLog from '../assets/items/pine-log.png'

/**
 * Display copy for content ids. The server owns every rule and number; this file only
 * names things for the screen. It moves to server-provided content once items and skills
 * get their own catalogs.
 */

export interface TradeLabel {
  name: string
  /** CSS colour of the trade's painted sign. */
  paint: string
  /** Line icon, used where the trade has no pixel-art emblem yet. */
  Icon: LucideIcon
  /** URL of the trade's 32x32 pixel-art emblem. */
  emblem?: string
}

interface ActionLabel {
  name: string
  verb: string
  /** Line icon, used where the action has no pixel-art sprite yet. */
  Icon: LucideIcon
  /** URL of the action's 32x32 pixel-art sprite. */
  sprite?: string
}

interface ItemLabel {
  name: string
  /** URL of the item's 32x32 pixel-art sprite. */
  sprite?: string
}

const trades: Record<string, TradeLabel> = {
  woodcutting: {
    name: 'Woodcutting',
    paint: 'var(--color-verdigris)',
    Icon: Axe,
    emblem: woodcuttingEmblem,
  },
}

const actions: Record<string, ActionLabel> = {
  'cut-pine': { name: 'Pine', verb: 'Cutting pine', Icon: TreePine, sprite: pineTree },
  'cut-birch': { name: 'Birch', verb: 'Cutting birch', Icon: TreeDeciduous, sprite: birchTree },
}

const items: Record<string, ItemLabel> = {
  'pine-log': { name: 'Pine log', sprite: pineLog },
  'birch-log': { name: 'Birch log', sprite: birchLog },
}

function humanize(id: string): string {
  const words = id.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function tradeLabel(skillId: string): TradeLabel {
  return (
    trades[skillId] ?? {
      name: humanize(skillId),
      paint: 'var(--color-ink)',
      Icon: Axe,
    }
  )
}

export function actionLabel(actionId: string): ActionLabel {
  return actions[actionId] ?? { name: humanize(actionId), verb: humanize(actionId), Icon: TreePine }
}

export function itemLabel(itemId: string): string {
  return items[itemId]?.name ?? humanize(itemId)
}

export function itemSprite(itemId: string): string | undefined {
  return items[itemId]?.sprite
}
