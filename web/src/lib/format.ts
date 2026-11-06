import { useTranslation } from 'react-i18next'

/** "9,840" in English, "9.840" in Portuguese. */
export function formatCount(value: number, language = 'en'): string {
  return new Intl.NumberFormat(language).format(value)
}

/** "3 s", "4 min", "8 h 12 min". The units read the same in English and Portuguese. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  if (totalSeconds < 60) return `${totalSeconds} s`

  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/** Number formatting in the current language. */
export function useFormat() {
  const { i18n } = useTranslation()
  return {
    count: (value: number) => formatCount(value, i18n.language),
    duration: formatDuration,
  }
}
