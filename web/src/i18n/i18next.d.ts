import 'i18next'
import type { en } from './locales/en'

// Types every `t('...')` call against the English file, so a missing key fails the build.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en }
  }
}
