import { describe, expect, it } from 'vitest'
import { ApiError, type Skill } from '../../api/client'
import { hasProgressWorthSaving } from './nudge'
import { formProblems } from './queries'

const skill = (level: number): Skill => ({ xp: level * 100, level, levelStartXp: 0, nextLevelXp: null })

describe('formProblems', () => {
  it('names each field a validation problem refused', () => {
    const error = new ApiError(400, { errors: { email: ['taken'], password: ['short'] } })

    expect(formProblems(error)).toEqual(['email', 'password'])
  })

  it('reports a refused sign-in without saying which part was wrong', () => {
    expect(formProblems(new ApiError(401, {}))).toEqual(['login'])
  })

  it('falls back to a general failure for anything else', () => {
    expect(formProblems(new ApiError(400, { errors: { userName: ['taken'] } }))).toEqual(['failed'])
    expect(formProblems(new ApiError(500, {}))).toEqual(['failed'])
    expect(formProblems(new TypeError('Failed to fetch'))).toEqual(['failed'])
  })

  it('is empty without an error', () => {
    expect(formProblems(null)).toEqual([])
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
