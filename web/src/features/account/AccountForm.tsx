import { useId, useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '../../components/Button'
import type { AccountProblem } from './queries'
import { cn } from '../../lib/cn'

export type AccountFormMode = 'register' | 'login'

interface AccountFormProps {
  mode: AccountFormMode
  pending: boolean
  problems: AccountProblem[]
  /** Signing in from a guest hold with progress deletes that hold, so the form says so. */
  warnGuest: boolean
  onSubmit: (email: string, password: string) => void
  onSwitch: () => void
}

const inputClass =
  'min-h-11 w-full rounded border border-rule bg-white px-3 text-[16px] text-ink aria-[invalid=true]:border-danger'

/** E-mail and password, for both creating an account and signing in. */
export function AccountForm({ mode, pending, problems, warnGuest, onSubmit, onSwitch }: AccountFormProps) {
  const { t } = useTranslation()
  const id = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const registering = mode === 'register'

  const emailError = problems.includes('email') ? t('account.errors.email') : undefined
  const passwordError = problems.includes('password') ? t('account.errors.password') : undefined
  const formError = problems.includes('login')
    ? t('account.errors.login')
    : problems.includes('failed')
      ? t('account.errors.failed')
      : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(email.trim(), password)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-email`} className="text-[15px] font-bold">
          {t('account.email')}
        </label>
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete={registering ? 'email' : 'username'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${id}-email-error` : undefined}
          className={inputClass}
        />
        {emailError && (
          <p id={`${id}-email-error`} className="text-[14px] font-medium text-danger">
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-password`} className="text-[15px] font-bold">
          {t('account.password')}
        </label>
        <input
          id={`${id}-password`}
          type="password"
          required
          minLength={registering ? 8 : undefined}
          autoComplete={registering ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError || registering ? `${id}-password-note` : undefined}
          className={inputClass}
        />
        {(passwordError || registering) && (
          <p id={`${id}-password-note`} className={cn('text-[14px]', passwordError ? 'font-medium text-danger' : 'text-muted')}>
            {passwordError ?? t('account.passwordHint')}
          </p>
        )}
      </div>

      {warnGuest && !registering && <p className="text-[15px] text-muted">{t('account.login.guestWarning')}</p>}

      {formError && (
        <p role="alert" className="text-[15px] font-medium text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="min-h-11">
        {pending ? t(`account.${mode}.submitting`) : t(`account.${mode}.submit`)}
      </Button>

      <p className="text-center text-[15px] text-muted">
        <Trans
          i18nKey={`account.${mode}.switch`}
          components={{
            action: <button type="button" onClick={onSwitch} className="font-bold text-ink underline underline-offset-2" />,
          }}
        />
      </p>
    </form>
  )
}
