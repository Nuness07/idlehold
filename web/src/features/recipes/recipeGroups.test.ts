import { describe, expect, it } from 'vitest'
import type { GameAction } from '../../api/client'
import { recipeGroupsFor, shownRecipeGroup } from './recipeGroups'

const action = (id: string, groupId: string | null): GameAction => ({
  id,
  skillId: 'cooking',
  durationMs: 3000,
  xpPerCompletion: 8,
  outputItemId: id,
  outputQuantity: 1,
  inputs: [],
  requiredLevel: 1,
  usesFuel: true,
  groupId,
})

const groups = [
  { id: 'chipped-stone', skillId: 'crafting' },
  { id: 'campfire', skillId: 'cooking' },
  { id: 'stone-furnace', skillId: 'cooking' },
  { id: 'clay-oven', skillId: 'cooking' },
]

describe('recipeGroupsFor', () => {
  it("lists the trade's groups in order and marks the ones without recipes", () => {
    const found = recipeGroupsFor('cooking', groups, [action('grill', 'campfire'), action('bake', 'clay-oven')])

    expect(found).toEqual([
      { id: 'campfire', open: true },
      { id: 'stone-furnace', open: false },
      { id: 'clay-oven', open: true },
    ])
  })

  it('is empty for a trade without groups', () => {
    expect(recipeGroupsFor('mining', groups, [])).toEqual([])
  })
})

describe('shownRecipeGroup', () => {
  const found = [
    { id: 'campfire', open: true },
    { id: 'stone-furnace', open: false },
    { id: 'clay-oven', open: true },
  ]

  it('prefers the picked group, then the working one, then the first with recipes', () => {
    expect(shownRecipeGroup(found, 'clay-oven', 'campfire')).toBe('clay-oven')
    expect(shownRecipeGroup(found, undefined, 'clay-oven')).toBe('clay-oven')
    expect(shownRecipeGroup(found, undefined, undefined)).toBe('campfire')
  })

  it('never shows a group that has no recipes yet', () => {
    expect(shownRecipeGroup(found, 'stone-furnace', null)).toBe('campfire')
  })

  it('is undefined for a trade without groups', () => {
    expect(shownRecipeGroup([], undefined, undefined)).toBeUndefined()
  })
})
