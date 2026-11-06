import { useTranslation } from 'react-i18next'
import { languages, type Language } from '../i18n'

const short: Record<Language, string> = { en: 'EN', 'pt-BR': 'PT' }

/** A two-way switch on the oxblood band. Each option names its language in that language. */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded border border-oxblood-soft/40 p-0.5">
      {languages.map((language) => {
        const active = i18n.language === language
        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={active}
            title={t(`language.${language}`)}
            onClick={() => void i18n.changeLanguage(language)}
            className={`min-h-8 rounded-sm px-2.5 text-[13px] font-extrabold tracking-[0.08em] transition-colors ${
              active ? 'bg-oxblood-ink text-oxblood' : 'text-oxblood-soft hover:text-oxblood-ink'
            }`}
          >
            <span aria-hidden>{short[language]}</span>
            <span className="sr-only">{t(`language.${language}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
