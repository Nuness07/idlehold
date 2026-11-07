import { useTranslation } from 'react-i18next'
import type { Account } from '../../api/client'
import { Button } from '../../components/Button'
import { LanguageSwitch } from '../../components/LanguageSwitch'

interface SettingsProps {
  account: Account
  onSaveProgress: () => void
  onSignIn: () => void
  onSignOut: () => void
  signingOut: boolean
}

const sectionTitle = 'text-xs font-extrabold tracking-[0.14em] text-muted uppercase'

/**
 * The language and the account. A guest can save progress or sign in, and has no "Sign out":
 * its hold could never be opened again.
 */
export function Settings({ account, onSaveProgress, onSignIn, onSignOut, signingOut }: SettingsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <section aria-labelledby="settings-language" className="paper flex flex-wrap items-center justify-between gap-3 rounded px-5 py-4">
        <h2 id="settings-language" className={sectionTitle}>
          {t('language.label')}
        </h2>
        <LanguageSwitch />
      </section>

      <section aria-labelledby="settings-account" className="paper flex flex-col gap-3 rounded px-5 py-4">
        <h2 id="settings-account" className={sectionTitle}>
          {t('settings.account')}
        </h2>
        {account.isGuest ? (
          <>
            <p className="text-[16px] leading-snug">{t('settings.guestBody')}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onSaveProgress}>{t('account.saveProgress')}</Button>
              <Button variant="quiet" onClick={onSignIn}>
                {t('account.signIn')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="truncate text-[16px]" title={account.email ?? undefined}>
              {t('account.signedInAs', { email: account.email })}
            </p>
            <div>
              <Button variant="quiet" onClick={onSignOut} disabled={signingOut}>
                {t('account.signOut')}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
