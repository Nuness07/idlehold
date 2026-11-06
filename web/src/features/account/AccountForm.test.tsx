import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AccountForm } from './AccountForm'

const defaults = { pending: false, problems: [], warnGuest: false, onSubmit: vi.fn(), onSwitch: vi.fn() }

describe('AccountForm', () => {
  it('sends the trimmed e-mail and the password', async () => {
    const onSubmit = vi.fn()
    render(<AccountForm {...defaults} mode="register" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('E-mail'), '  ana@example.test ')
    await userEvent.type(screen.getByLabelText('Password'), 'a long enough password')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(onSubmit).toHaveBeenCalledWith('ana@example.test', 'a long enough password')
  })

  it('marks the fields the server refused', () => {
    render(<AccountForm {...defaults} mode="register" problems={['email', 'password']} />)

    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription(/may be invalid or already have an account/)
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(/at least 8 characters/)
  })

  it('gives one message for any refused sign-in', () => {
    render(<AccountForm {...defaults} mode="login" problems={['login']} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Wrong e-mail or password, or too many attempts.')
  })

  it('warns that signing in leaves the guest hold behind', () => {
    render(<AccountForm {...defaults} mode="login" warnGuest />)

    expect(screen.getByText(/guest hold in this browser is left behind/)).toBeInTheDocument()
  })

  it('switches between creating an account and signing in', async () => {
    const onSwitch = vi.fn()
    render(<AccountForm {...defaults} mode="register" onSwitch={onSwitch} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(onSwitch).toHaveBeenCalled()
  })

  it('disables the submit button while the request runs', () => {
    render(<AccountForm {...defaults} mode="login" pending />)

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
  })
})
