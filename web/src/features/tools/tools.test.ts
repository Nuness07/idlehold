import { describe, expect, it } from 'vitest'
import type { GameAction } from '../../api/client'
import { toolCardsFor } from './tools'

const recipe = (id: string, outputItemId: string, skillId = 'crafting'): GameAction => ({
  id, skillId, durationMs: 30000, xpPerCompletion: 40, outputItemId, outputQuantity: 1, inputs: [],
})

const axe = recipe('craft-axe', 'axe')
const goodAxe = recipe('craft-good-axe', 'good-axe')
const actions = [recipe('cut-pine', 'pine-log', 'woodcutting'), axe, goodAxe]

describe('toolCardsFor', () => {
  it('shows the next tier the server offers', () => {
    const cards = toolCardsFor('crafting', [{ family: 'axe', ownedItemId: 'axe', nextActionId: 'craft-good-axe' }], actions)

    expect(cards).toEqual([{ family: 'axe', itemId: 'good-axe', recipe: goodAxe }])
  })

  it('shows the owned tool, with nothing to build, once it is the best', () => {
    const cards = toolCardsFor('crafting', [{ family: 'axe', ownedItemId: 'good-axe', nextActionId: null }], actions)

    expect(cards).toEqual([{ family: 'axe', itemId: 'good-axe', recipe: undefined }])
  })

  it('leaves the family out of trades that do not make it', () => {
    expect(toolCardsFor('woodcutting', [{ family: 'axe', ownedItemId: null, nextActionId: 'craft-axe' }], actions)).toEqual([])
  })
})
