import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Account } from '../../api/client'
import { MenuBar, SideMenu } from './SideMenu'

const guest: Account = { email: null, isGuest: true }
const account: Account = { email: 'ana@example.test', isGuest: false }

describe('SideMenu', () => {
  it('lists the hold screens in order and marks the open one', () => {
    render(<SideMenu screen="history" onOpen={vi.fn()} account={guest} onSaveProgress={vi.fn()} />)

    const menu = screen.getByRole('navigation', { name: 'Hold menu' })
    const names = within(menu)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(names).toEqual(['Storehouse', 'Achievements', 'History', 'Statistics'])
    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Storehouse' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens a screen', async () => {
    const onOpen = vi.fn()
    render(<SideMenu screen="village" onOpen={onOpen} account={guest} onSaveProgress={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Storehouse' }))
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(onOpen.mock.calls).toEqual([['storehouse'], ['settings']])
  })

  it('shows a guest as Guest, with a way to save progress', async () => {
    const onSaveProgress = vi.fn()
    render(<SideMenu screen="village" onOpen={vi.fn()} account={guest} onSaveProgress={onSaveProgress} />)

    expect(screen.getByText('Guest')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save progress' }))

    expect(onSaveProgress).toHaveBeenCalled()
  })

  it('names a signed-in account by its e-mail, with nothing to save', () => {
    render(<SideMenu screen="village" onOpen={vi.fn()} account={account} onSaveProgress={vi.fn()} />)

    expect(screen.getByText('ana@example.test')).toBeInTheDocument()
    expect(screen.getByText('Signed in')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save progress' })).not.toBeInTheDocument()
  })
})

describe('MenuBar', () => {
  it('holds every screen, settings included', async () => {
    const onOpen = vi.fn()
    render(<MenuBar screen="statistics" onOpen={onOpen} />)

    expect(screen.getByRole('button', { name: 'Statistics' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(onOpen).toHaveBeenCalledWith('settings')
  })
})
