import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameAction } from '../../api/client'
import { ActionList } from './ActionList'

const actions: GameAction[] = [
  { id: 'cut-pine', skillId: 'woodcutting', durationMs: 3000, xpPerCompletion: 10, outputItemId: 'pine-log', outputQuantity: 1 },
  { id: 'cut-birch', skillId: 'woodcutting', durationMs: 5000, xpPerCompletion: 18, outputItemId: 'birch-log', outputQuantity: 1 },
]

describe('ActionList', () => {
  it('starts an action when nothing is being worked', async () => {
    const onStart = vi.fn()
    render(<ActionList actions={actions} activeActionId={undefined} pendingActionId={undefined} onStart={onStart} />)

    const buttons = screen.getAllByRole('button', { name: 'Start' })
    await userEvent.click(buttons[0])

    expect(onStart).toHaveBeenCalledWith('cut-pine')
  })

  it('marks the working action and offers to switch to the others', () => {
    render(<ActionList actions={actions} activeActionId="cut-pine" pendingActionId={undefined} onStart={vi.fn()} />)

    expect(screen.getByText('Working')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch' })).toBeEnabled()
  })

  it('disables the action that is being started', () => {
    render(<ActionList actions={actions} activeActionId={undefined} pendingActionId="cut-birch" onStart={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled()
  })
})
