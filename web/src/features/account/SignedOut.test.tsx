import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SignedOut } from './SignedOut'

const defaults = { onSignIn: vi.fn(), onNewGuest: vi.fn() }

describe('SignedOut', () => {
  it('explains that the hold is tied to an account', () => {
    render(<SignedOut {...defaults} />)

    expect(screen.getByRole('heading', { name: 'This hold belongs to an account' })).toBeInTheDocument()
  })

  it('signs in to the hold', async () => {
    const onSignIn = vi.fn()
    render(<SignedOut {...defaults} onSignIn={onSignIn} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(onSignIn).toHaveBeenCalled()
  })

  it('starts a fresh guest hold instead', async () => {
    const onNewGuest = vi.fn()
    render(<SignedOut {...defaults} onNewGuest={onNewGuest} />)

    await userEvent.click(screen.getByRole('button', { name: 'Start a new hold as a guest' }))

    expect(onNewGuest).toHaveBeenCalled()
  })
})
