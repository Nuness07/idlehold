import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import i18n from '../i18n'
import { stubMatchMedia } from './matchMedia'

// Tests read English copy unless a test switches the language itself.
beforeEach(async () => {
  await i18n.changeLanguage('en')
})

// jsdom has no matchMedia; tests start at phone width unless a test widens the screen itself.
beforeEach(() => {
  stubMatchMedia(false)
})

afterEach(() => cleanup())
