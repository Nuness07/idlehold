import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameAction } from '../../api/client'
import { ActionList } from './ActionList'

const actions: GameAction[] = [
  { id: 'cut-pine', skillId: 'woodcutting', durationMs: 3000, xpPerCompletion: 10, outputItemId: 'pine-log', outputQuantity: 1, inputs: [], requiredLevel: 1, usesFuel: false },
  { id: 'cut-birch', skillId: 'woodcutting', durationMs: 5000, xpPerCompletion: 18, outputItemId: 'birch-log', outputQuantity: 1, inputs: [], requiredLevel: 1, usesFuel: false },
]

describe('ActionList', () => {
  it('starts an action when nothing is being worked', async () => {
    const onStart = vi.fn()
    render(<ActionList actions={actions} activeActionId={undefined} pendingActionId={undefined} level={1} onStart={onStart} />)

    const buttons = screen.getAllByRole('button', { name: 'Start' })
    await userEvent.click(buttons[0])

    expect(onStart).toHaveBeenCalledWith('cut-pine')
  })

  it('marks the working action and offers to switch to the others', () => {
    render(<ActionList actions={actions} activeActionId="cut-pine" pendingActionId={undefined} level={1} onStart={vi.fn()} />)

    expect(screen.getByText('Working')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch' })).toBeEnabled()
  })

  it('disables the action that is being started', () => {
    render(<ActionList actions={actions} activeActionId={undefined} pendingActionId="cut-birch" level={1} onStart={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled()
  })

  it("locks an action above the player's level and shows the level it opens at", () => {
    const birch = { ...actions[1], requiredLevel: 30 }
    render(<ActionList actions={[actions[0], birch]} activeActionId={undefined} pendingActionId={undefined} level={12} onStart={vi.fn()} />)

    expect(screen.getAllByRole('button', { name: 'Start' })).toHaveLength(1)
    expect(screen.getByText('Level 30')).toBeInTheDocument()
  })

  it('lists what a recipe uses', () => {
    const grill: GameAction = {
      ...actions[0],
      id: 'cook-grilled-berries',
      outputItemId: 'grilled-berries',
      inputs: [{ itemId: 'wild-berry', quantity: 2 }],
      usesFuel: true,
    }
    render(<ActionList actions={[grill]} activeActionId={undefined} pendingActionId={undefined} level={1} onStart={vi.fn()} />)

    expect(screen.getByText('Uses 2 wild berries')).toBeInTheDocument()
  })
})
