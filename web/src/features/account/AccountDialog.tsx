import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountForm, type AccountFormMode } from './AccountForm'
import { formProblems, useLogin, useRegister } from './queries'

interface AccountDialogProps {
  /** Which form is open, or `null` when the dialog is closed. */
  mode: AccountFormMode | null
  onModeChange: (mode: AccountFormMode) => void
  onClose: () => void
  /** A guest hold with progress is on screen. Creating an account keeps it; signing in deletes it. */
  guestHasProgress: boolean
}

/**
 * Sign-up and sign-in in a native modal dialog over the game. The browser handles focus, Escape
 * and the inert page behind it.
 */
export function AccountDialog({ mode, onModeChange, onClose, guestHasProgress }: AccountDialogProps) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  const register = useRegister()
  const login = useLogin()
  const active = mode === 'login' ? login : register

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (mode && !element.open) element.showModal()
    if (!mode && element.open) element.close()
  }, [mode])

  const switchTo = (next: AccountFormMode) => {
    register.reset()
    login.reset()
    onModeChange(next)
  }

  const submit = (email: string, password: string) => {
    const done = { onSuccess: onClose }
    if (mode === 'login') login.mutate({ email, password }, done)
    else register.mutate({ email, password }, done)
  }

  return (
    <dialog
      ref={dialog}
      onClose={() => {
        register.reset()
        login.reset()
        onClose()
      }}
      aria-labelledby="account-title"
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-md border border-rule bg-limewash p-0 text-ink shadow-[0_18px_50px_rgb(27_23_18/0.28)] backdrop:bg-ink/45"
    >
      {mode && (
        <div className="flex flex-col gap-5 px-6 pt-5 pb-6 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="account-title" className="font-gothic text-[30px] leading-tight font-bold">
                {t(`account.${mode}.title`)}
              </h2>
              <p className="text-[16px] text-muted">{t(`account.${mode}.body`)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('account.close')}
              className="-mr-2 ml-auto grid size-9 shrink-0 place-items-center rounded text-muted hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          <AccountForm
            key={mode}
            mode={mode}
            pending={active.isPending}
            problems={formProblems(active.error)}
            warnGuest={guestHasProgress}
            onSubmit={submit}
            onSwitch={() => switchTo(mode === 'login' ? 'register' : 'login')}
          />
        </div>
      )}
    </dialog>
  )
}
