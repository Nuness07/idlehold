import { describe, expect, it } from 'vitest'
import { formatCount, formatDuration } from './format'

describe('formatDuration', () => {
  it.each([
    [3_000, '3 s'],
    [59_400, '59 s'],
    [240_000, '4 min'],
    [3_600_000, '1 h'],
    [29_520_000, '8 h 12 min'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })

  it('never shows negative time', () => {
    expect(formatDuration(-500)).toBe('0 s')
  })
})

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(9840)).toBe('9,840')
  })
})
