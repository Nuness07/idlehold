import { Axe, Cherry, Fish, FishSymbol, Gem, Hammer, Hand, Mountain, Pickaxe, Sprout, TreeDeciduous, TreePine, type LucideIcon } from 'lucide-react'
import berryBush from '../assets/actions/berry-bush.png'
import birchTree from '../assets/actions/birch-tree.png'
import copperDeposit from '../assets/actions/copper.png'
import perchSpot from '../assets/actions/perch.png'
import pebbleScatter from '../assets/actions/pebbles.png'
import pikeSpot from '../assets/actions/pike.png'
import pineTree from '../assets/actions/pine-tree.png'
import stoneOutcrop from '../assets/actions/stone.png'
import fallenTwigs from '../assets/actions/twigs.png'
import fishingEmblem from '../assets/emblems/fishing.png'
import foragingEmblem from '../assets/emblems/foraging.png'
import miningEmblem from '../assets/emblems/mining.png'
import woodcuttingEmblem from '../assets/emblems/woodcutting.png'
import birchLog from '../assets/items/birch-log.png'
import copperOre from '../assets/items/copper-ore.png'
import pebbleItem from '../assets/items/pebble.png'
import perchItem from '../assets/items/perch.png'
import pikeItem from '../assets/items/pike.png'
import pineLog from '../assets/items/pine-log.png'
import stoneBlock from '../assets/items/stone.png'
import twigItem from '../assets/items/twig.png'
import wildBerry from '../assets/items/wild-berry.png'

/**
 * How content ids look on screen: paint, icons and pixel-art sprites. The server owns every
 * rule and number, and the words live in the translation files (`src/i18n/locales`).
 */

export interface TradeLabel {
  /** CSS colour of the trade's painted sign. */
  paint: string
  /** Line icon, used where the trade has no pixel-art emblem yet. */
  Icon: LucideIcon
  /** URL of the trade's 32x32 pixel-art emblem. */
  emblem?: string
}

interface ActionLabel {
  /** Line icon, used where the action has no pixel-art sprite yet. */
  Icon: LucideIcon
  /** URL of the action's 32x32 pixel-art sprite. */
  sprite?: string
}

const trades: Record<string, TradeLabel> = {
  woodcutting: { paint: 'var(--color-verdigris)', Icon: Axe, emblem: woodcuttingEmblem },
  fishing: { paint: 'var(--color-lake)', Icon: Fish, emblem: fishingEmblem },
  mining: { paint: 'var(--color-slate)', Icon: Pickaxe, emblem: miningEmblem },
  foraging: { paint: 'var(--color-bramble)', Icon: Cherry, emblem: foragingEmblem },
  crafting: { paint: 'var(--color-moss)', Icon: Hammer },
}

const actions: Record<string, ActionLabel> = {
  'gather-twigs': { Icon: Hand, sprite: fallenTwigs },
  'cut-pine': { Icon: TreePine, sprite: pineTree },
  'cut-birch': { Icon: TreeDeciduous, sprite: birchTree },
  'catch-perch': { Icon: Fish, sprite: perchSpot },
  'catch-pike': { Icon: FishSymbol, sprite: pikeSpot },
  'pick-pebbles': { Icon: Hand, sprite: pebbleScatter },
  'mine-stone': { Icon: Mountain, sprite: stoneOutcrop },
  'mine-copper': { Icon: Gem, sprite: copperDeposit },
  'pick-wild-berries': { Icon: Cherry, sprite: berryBush },
  'pull-reeds': { Icon: Sprout },
  'craft-chipped-stone-axe': { Icon: Axe },
  'craft-reed-fishing-rod': { Icon: Fish },
}

const itemSprites: Record<string, string> = {
  'pine-log': pineLog,
  'birch-log': birchLog,
  perch: perchItem,
  pike: pikeItem,
  stone: stoneBlock,
  'copper-ore': copperOre,
  twig: twigItem,
  pebble: pebbleItem,
  'wild-berry': wildBerry,
}

export function tradeLabel(skillId: string): TradeLabel {
  return trades[skillId] ?? { paint: 'var(--color-ink)', Icon: Axe }
}

export function actionLabel(actionId: string): ActionLabel {
  return actions[actionId] ?? { Icon: TreePine }
}

export function itemSprite(itemId: string): string | undefined {
  return itemSprites[itemId]
}
