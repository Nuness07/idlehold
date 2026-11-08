import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'
import { cn } from '../lib/cn'

/** A two-way switch on a paper. Each option names its language in that language. */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded border border-ink/30 p-0.5">
      {languages.map((language) => {
        const active = i18n.language === language
        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(language)}
            className={cn(
              'min-h-9 rounded-sm px-3 text-[14px] font-bold transition-colors',
              active ? 'bg-oxblood text-oxblood-ink' : 'text-muted hover:text-ink',
            )}
          >
            {t(`language.${language}`)}
          </button>
        )
      })}
    </div>
  )
}
