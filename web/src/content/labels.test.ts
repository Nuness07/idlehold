import { describe, expect, it } from 'vitest'
import { itemCount } from './labels'

describe('itemCount', () => {
  it('uses the singular for one item', () => {
    expect(itemCount('pine-log', 1)).toBe('pine log')
  })

  it('adds an s by default', () => {
    expect(itemCount('pine-log', 9)).toBe('pine logs')
  })

  it('uses an irregular plural when one is set', () => {
    expect(itemCount('perch', 9)).toBe('perch')
    expect(itemCount('copper-ore', 3)).toBe('copper ore')
  })
})
