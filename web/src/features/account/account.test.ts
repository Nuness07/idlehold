import { describe, expect, it } from 'vitest'
import type { Skill } from '../../api/client'
import { hasProgressWorthSaving } from './nudge'
import { problemsFromValidation } from './queries'

const skill = (level: number): Skill => ({ xp: level * 100, level, levelStartXp: 0, nextLevelXp: null })

describe('problemsFromValidation', () => {
  it('names each refused field', () => {
    expect(problemsFromValidation({ email: ['taken'], password: ['short'] })).toEqual(['email', 'password'])
  })

  it('falls back to a general failure for anything else', () => {
    expect(problemsFromValidation({ userName: ['taken'] })).toEqual(['failed'])
    expect(problemsFromValidation(undefined)).toEqual(['failed'])
  })
})

describe('hasProgressWorthSaving', () => {
  it('is false while every trade is at level 1', () => {
    expect(hasProgressWorthSaving({ woodcutting: skill(1) })).toBe(false)
    expect(hasProgressWorthSaving({})).toBe(false)
  })

  it('is true once any trade rises past level 1', () => {
    expect(hasProgressWorthSaving({ woodcutting: skill(1), mining: skill(2) })).toBe(true)
  })
})
