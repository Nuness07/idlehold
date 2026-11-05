import { Axe, Fish, FishSymbol, Gem, Mountain, Pickaxe, TreeDeciduous, TreePine, type LucideIcon } from 'lucide-react'
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
  /** Lower-case plural for counts ("9 pine logs"). Defaults to the name plus "s". */
  plural?: string
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
  fishing: {
    name: 'Fishing',
    paint: 'var(--color-lake)',
    Icon: Fish,
  },
  mining: {
    name: 'Mining',
    paint: 'var(--color-slate)',
    Icon: Pickaxe,
  },
}

const actions: Record<string, ActionLabel> = {
  'cut-pine': { name: 'Pine', verb: 'Cutting pine', Icon: TreePine, sprite: pineTree },
  'cut-birch': { name: 'Birch', verb: 'Cutting birch', Icon: TreeDeciduous, sprite: birchTree },
  'catch-perch': { name: 'Perch', verb: 'Catching perch', Icon: Fish },
  'catch-pike': { name: 'Pike', verb: 'Catching pike', Icon: FishSymbol },
  'mine-stone': { name: 'Stone', verb: 'Mining stone', Icon: Mountain },
  'mine-copper': { name: 'Copper', verb: 'Mining copper', Icon: Gem },
}

const items: Record<string, ItemLabel> = {
  'pine-log': { name: 'Pine log', sprite: pineLog },
  'birch-log': { name: 'Birch log', sprite: birchLog },
  perch: { name: 'Perch', plural: 'perch' },
  pike: { name: 'Pike', plural: 'pike' },
  stone: { name: 'Stone', plural: 'stone' },
  'copper-ore': { name: 'Copper ore', plural: 'copper ore' },
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

/** "1 pine log", "9 pine logs", "9 perch". */
export function itemCount(itemId: string, count: number): string {
  const singular = itemLabel(itemId).toLowerCase()
  return count === 1 ? singular : (items[itemId]?.plural ?? `${singular}s`)
}

export function itemSprite(itemId: string): string | undefined {
  return items[itemId]?.sprite
}
