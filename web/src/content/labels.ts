import { Axe, Cherry, CookingPot, Fish, FishSymbol, Flame, Gem, Hammer, Hand, Mountain, Pickaxe, Slice, Sprout, TreeDeciduous, TreePine, type LucideIcon } from 'lucide-react'
import berryBush from '../assets/actions/berry-bush.png'
import tower from '../assets/brand/tower.png'
import birchTree from '../assets/actions/birch-tree.png'
import copperDeposit from '../assets/actions/copper.png'
import perchSpot from '../assets/actions/perch.png'
import pebbleScatter from '../assets/actions/pebbles.png'
import pikeSpot from '../assets/actions/pike.png'
import pineTree from '../assets/actions/pine-tree.png'
import reedClump from '../assets/actions/reeds.png'
import stoneOutcrop from '../assets/actions/stone.png'
import fallenTwigs from '../assets/actions/twigs.png'
import youngHazel from '../assets/actions/young-hazel.png'
import carpentryEmblem from '../assets/emblems/carpentry.png'
import cookingEmblem from '../assets/emblems/cooking.png'
import craftingEmblem from '../assets/emblems/crafting.png'
import fishingEmblem from '../assets/emblems/fishing.png'
import foragingEmblem from '../assets/emblems/foraging.png'
import miningEmblem from '../assets/emblems/mining.png'
import woodcuttingEmblem from '../assets/emblems/woodcutting.png'
import berrySoup from '../assets/items/berry-soup.png'
import birchLog from '../assets/items/birch-log.png'
import chippedStoneAxe from '../assets/items/chipped-stone-axe.png'
import chippedStoneKnife from '../assets/items/chipped-stone-knife.png'
import chippedStonePickaxe from '../assets/items/chipped-stone-pickaxe.png'
import copperOre from '../assets/items/copper-ore.png'
import grilledBerries from '../assets/items/grilled-berries.png'
import hazelLog from '../assets/items/hazel-log.png'
import hazelStick from '../assets/items/hazel-stick.png'
import pebbleItem from '../assets/items/pebble.png'
import perchItem from '../assets/items/perch.png'
import pikeItem from '../assets/items/pike.png'
import pineLog from '../assets/items/pine-log.png'
import reedFishingRod from '../assets/items/reed-fishing-rod.png'
import reedItem from '../assets/items/reed.png'
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

/** The hold's stone tower, 32x32 art pixels: the Village's emblem and the mark beside the wordmark. */
export const towerSprite = tower

const trades: Record<string, TradeLabel> = {
  woodcutting: { paint: 'var(--color-verdigris)', Icon: Axe, emblem: woodcuttingEmblem },
  fishing: { paint: 'var(--color-lake)', Icon: Fish, emblem: fishingEmblem },
  mining: { paint: 'var(--color-slate)', Icon: Pickaxe, emblem: miningEmblem },
  foraging: { paint: 'var(--color-bramble)', Icon: Cherry, emblem: foragingEmblem },
  crafting: { paint: 'var(--color-moss)', Icon: Hammer, emblem: craftingEmblem },
  carpentry: { paint: 'var(--color-russet)', Icon: Slice, emblem: carpentryEmblem },
  cooking: { paint: 'var(--color-ember)', Icon: CookingPot, emblem: cookingEmblem },
}

const actions: Record<string, ActionLabel> = {
  'gather-twigs': { Icon: Hand, sprite: fallenTwigs },
  'cut-young-hazel': { Icon: TreeDeciduous, sprite: youngHazel },
  'cut-pine': { Icon: TreePine, sprite: pineTree },
  'cut-birch': { Icon: TreeDeciduous, sprite: birchTree },
  'catch-perch': { Icon: Fish, sprite: perchSpot },
  'catch-pike': { Icon: FishSymbol, sprite: pikeSpot },
  'pick-pebbles': { Icon: Hand, sprite: pebbleScatter },
  'mine-stone': { Icon: Mountain, sprite: stoneOutcrop },
  'mine-copper': { Icon: Gem, sprite: copperDeposit },
  'pick-wild-berries': { Icon: Cherry, sprite: berryBush },
  'pull-reeds': { Icon: Sprout, sprite: reedClump },
  // A recipe shows what it makes.
  'craft-chipped-stone-axe': { Icon: Axe, sprite: chippedStoneAxe },
  'craft-chipped-stone-knife': { Icon: Slice, sprite: chippedStoneKnife },
  'craft-chipped-stone-pickaxe': { Icon: Pickaxe, sprite: chippedStonePickaxe },
  'craft-reed-fishing-rod': { Icon: Fish, sprite: reedFishingRod },
  'whittle-hazel-sticks': { Icon: Slice, sprite: hazelStick },
  'cook-grilled-berries': { Icon: Flame, sprite: grilledBerries },
  'cook-berry-soup': { Icon: CookingPot, sprite: berrySoup },
}

const itemSprites: Record<string, string> = {
  'hazel-log': hazelLog,
  'hazel-stick': hazelStick,
  'pine-log': pineLog,
  'birch-log': birchLog,
  perch: perchItem,
  pike: pikeItem,
  stone: stoneBlock,
  'copper-ore': copperOre,
  twig: twigItem,
  pebble: pebbleItem,
  'wild-berry': wildBerry,
  reed: reedItem,
  'chipped-stone-axe': chippedStoneAxe,
  'reed-fishing-rod': reedFishingRod,
  'chipped-stone-knife': chippedStoneKnife,
  'chipped-stone-pickaxe': chippedStonePickaxe,
  'grilled-berries': grilledBerries,
  'berry-soup': berrySoup,
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
