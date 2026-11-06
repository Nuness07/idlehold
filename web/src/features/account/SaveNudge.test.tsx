import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SaveNudge } from './SaveNudge'

const defaults = { onCreateAccount: vi.fn(), onDismiss: vi.fn() }

describe('SaveNudge', () => {
  it('invites a guest to keep the hold', () => {
    render(<SaveNudge {...defaults} />)

    expect(screen.getByText(/Create an account so it is not lost/)).toBeInTheDocument()
  })

  it('opens the account form from the nudge', async () => {
    const onCreateAccount = vi.fn()
    render(<SaveNudge {...defaults} onCreateAccount={onCreateAccount} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(onCreateAccount).toHaveBeenCalled()
  })

  it('reports when the player dismisses the nudge', async () => {
    const onDismiss = vi.fn()
    render(<SaveNudge {...defaults} onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalled()
  })
})
