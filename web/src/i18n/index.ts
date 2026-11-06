import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { readStorage, writeStorage } from '../lib/storage'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

export const languages = ['en', 'pt-BR'] as const
export type Language = (typeof languages)[number]

const LANGUAGE_KEY = 'idlehold.language'

function isLanguage(value: string | null): value is Language {
  return languages.includes(value as Language)
}

/** The saved choice wins; otherwise Portuguese browsers get Portuguese and everyone else English. */
export function initialLanguage(saved = readStorage(LANGUAGE_KEY), browser = navigator.language): Language {
  if (isLanguage(saved)) return saved
  return browser.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: initialLanguage(),
  fallbackLng: 'en',
  supportedLngs: languages,
  interpolation: { escapeValue: false }, // React already escapes.
  returnNull: false,
})

function applyLanguage(language: string): void {
  document.documentElement.lang = language
}

applyLanguage(i18n.language)
i18n.on('languageChanged', (language) => {
  applyLanguage(language)
  if (isLanguage(language)) writeStorage(LANGUAGE_KEY, language)
})

export default i18n
