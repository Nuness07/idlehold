import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Account } from '../../api/client'
import { AccountMenu } from './AccountMenu'

const account: Account = { email: 'ana@example.test', isGuest: false }
const guest: Account = { email: null, isGuest: true }

const defaults = { account: guest, onSaveProgress: vi.fn(), onSignOut: vi.fn(), signingOut: false }

describe('AccountMenu', () => {
  it('offers a guest a way to save progress, and no way to sign out', async () => {
    const onSaveProgress = vi.fn()
    render(<AccountMenu {...defaults} onSaveProgress={onSaveProgress} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save progress' }))

    expect(onSaveProgress).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  })

  it('names the signed-in account and signs it out', async () => {
    const onSignOut = vi.fn()
    render(<AccountMenu {...defaults} account={account} onSignOut={onSignOut} />)

    expect(screen.getByText('Signed in as ana@example.test')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Save progress' })).not.toBeInTheDocument()
  })

  it('blocks a second sign-out while the first runs', () => {
    render(<AccountMenu {...defaults} account={account} signingOut />)

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
  })
})
