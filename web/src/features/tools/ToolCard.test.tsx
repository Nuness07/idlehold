import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameAction } from '../../api/client'
import { ToolCard, VISIBLE_SLOTS } from './ToolCard'

const axeRecipe: GameAction = {
  id: 'craft-chipped-stone-axe',
  skillId: 'crafting',
  durationMs: 30000,
  xpPerCompletion: 40,
  outputItemId: 'chipped-stone-axe',
  outputQuantity: 1,
  inputs: [
    { itemId: 'twig', quantity: 3 },
    { itemId: 'pebble', quantity: 2 },
  ],
  requiredLevel: 1,
  usesFuel: false,
}

const card = (props: Partial<Parameters<typeof ToolCard>[0]> = {}) => (
  <ToolCard
    itemId="chipped-stone-axe"
    recipe={axeRecipe}
    inventory={{ twig: 3, pebble: 2 }}
    working={false}
    pending={false}
    onBuild={vi.fn()}
    {...props}
  />
)

describe('ToolCard', () => {
  it('shows what the tool takes and builds it', async () => {
    const onBuild = vi.fn()
    render(card({ onBuild }))

    const materials = screen.getByRole('list', { name: 'Materials' })
    expect(within(materials).getByText('3 of 3 twigs')).toBeInTheDocument()
    expect(within(materials).getByText('2 of 2 pebbles')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Build' }))
    expect(onBuild).toHaveBeenCalledWith('craft-chipped-stone-axe')
  })

  it('cannot be built while a material is short', () => {
    render(card({ inventory: { twig: 3, pebble: 1 } }))

    expect(screen.getByText('1 of 2 pebbles')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Build' })).toBeDisabled()
  })

  it('says it is building instead of offering the button', () => {
    render(card({ working: true }))

    expect(screen.getByText('Building')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Build' })).not.toBeInTheDocument()
  })

  it('shows the best tool owned with nothing to build', () => {
    render(card({ recipe: undefined }))

    expect(screen.getByText('Your best so far')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('folds a long recipe into a slot that expands the card', async () => {
    const inputs = Array.from({ length: VISIBLE_SLOTS + 2 }, (_, index) => ({ itemId: `item-${index}`, quantity: 1 }))
    render(card({ recipe: { ...axeRecipe, inputs }, inventory: {} }))

    const materials = screen.getByRole('list', { name: 'Materials' })
    // Five materials and the "+3" slot fill the six places.
    expect(within(materials).getAllByText(/^0 of 1 /)).toHaveLength(VISIBLE_SLOTS - 1)

    const more = within(materials).getByRole('button', { name: 'Show 3 more materials' })
    await userEvent.click(more)

    expect(within(materials).getAllByText(/^0 of 1 /)).toHaveLength(VISIBLE_SLOTS + 2)
    expect(within(materials).getByRole('button', { name: 'Show fewer materials' })).toHaveAttribute('aria-expanded', 'true')
  })
})
