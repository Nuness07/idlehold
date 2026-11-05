import { Axe, TreeDeciduous, TreePine, type LucideIcon } from 'lucide-react'

/**
 * Display copy for content ids. The server owns every rule and number; this file only
 * names things for the screen. It moves to server-provided content once items and skills
 * get their own catalogs.
 */

interface TradeLabel {
  name: string
  /** CSS colour of the trade's painted sign. */
  paint: string
  Icon: LucideIcon
}

interface ActionLabel {
  name: string
  verb: string
  Icon: LucideIcon
}

const trades: Record<string, TradeLabel> = {
  woodcutting: {
    name: 'Woodcutting',
    paint: 'var(--color-verdigris)',
    Icon: Axe,
  },
}

const actions: Record<string, ActionLabel> = {
  'cut-pine': { name: 'Pine', verb: 'Cutting pine', Icon: TreePine },
  'cut-birch': { name: 'Birch', verb: 'Cutting birch', Icon: TreeDeciduous },
}

const items: Record<string, string> = {
  'pine-log': 'Pine log',
  'birch-log': 'Birch log',
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
  return items[itemId] ?? humanize(itemId)
}
