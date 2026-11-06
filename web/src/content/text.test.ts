import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { contentText } from './text'

const text = () => contentText(i18n.t)

describe('contentText', () => {
  it('names content in English', () => {
    expect(text().tradeName('woodcutting')).toBe('Woodcutting')
    expect(text().actionVerb('catch-pike')).toBe('Catching pike')
  })

  it('pluralises item counts in English', () => {
    expect(text().itemCount('pine-log', 1)).toBe('pine log')
    expect(text().itemCount('pine-log', 9)).toBe('pine logs')
    expect(text().itemCount('perch', 9)).toBe('perch')
  })

  it('pluralises item counts in Portuguese', async () => {
    await i18n.changeLanguage('pt-BR')

    expect(text().itemCount('pine-log', 1)).toBe('tora de pinheiro')
    expect(text().itemCount('pine-log', 9)).toBe('toras de pinheiro')
    expect(text().itemCount('perch', 2_000_000)).toBe('percas')
    expect(text().tradeName('fishing')).toBe('Pescador')
  })

  it('falls back to a readable name for unknown ids', () => {
    expect(text().itemName('iron-bar')).toBe('Iron bar')
    expect(text().itemCount('iron-bar', 3)).toBe('iron bar')
  })
})
