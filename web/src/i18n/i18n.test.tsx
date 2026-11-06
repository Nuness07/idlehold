import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LanguageSwitch } from '../components/LanguageSwitch'
import i18n, { initialLanguage } from '.'

describe('initialLanguage', () => {
  it('keeps a saved choice', () => {
    expect(initialLanguage('en', 'pt-BR')).toBe('en')
  })

  it('uses Portuguese for any Portuguese browser', () => {
    expect(initialLanguage(null, 'pt-PT')).toBe('pt-BR')
    expect(initialLanguage(null, 'pt-BR')).toBe('pt-BR')
  })

  it('falls back to English', () => {
    expect(initialLanguage(null, 'de-DE')).toBe('en')
    expect(initialLanguage('fr', 'de-DE')).toBe('en')
  })
})

describe('LanguageSwitch', () => {
  it('switches the language, updates <html lang> and remembers the choice', async () => {
    render(<LanguageSwitch />)

    await userEvent.click(screen.getByRole('button', { name: 'Português (Brasil)' }))

    expect(i18n.language).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(window.localStorage.getItem('idlehold.language')).toBe('pt-BR')
    expect(screen.getByRole('button', { name: 'Português (Brasil)' })).toHaveAttribute('aria-pressed', 'true')
  })
})
