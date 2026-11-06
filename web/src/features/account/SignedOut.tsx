import { useTranslation } from 'react-i18next'
import { Button } from '../../components/Button'

interface SignedOutProps {
  onSignIn: () => void
  onNewGuest: () => void
}

/** Shown when this browser's hold belongs to an account and nobody is signed in. */
export function SignedOut({ onSignIn, onNewGuest }: SignedOutProps) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-2 px-6 py-20">
      <h1 className="font-gothic text-[38px] leading-tight font-bold">{t('account.signedOut.title')}</h1>
      <p className="text-lg text-muted">{t('account.signedOut.body')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onSignIn} className="min-h-11 px-5">
          {t('account.signIn')}
        </Button>
        <Button variant="quiet" onClick={onNewGuest} className="min-h-11">
          {t('account.signedOut.newGuest')}
        </Button>
      </div>
    </div>
  )
}
