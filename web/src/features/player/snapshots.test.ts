import { describe, expect, it } from 'vitest'
import type { Player } from '../../api/client'
import { keepNewest, type PlayerSnapshot } from './snapshots'

function snap(updatedAt: string, actionId: string | null, id = 'p1', replacedLostSave = false): PlayerSnapshot {
  const player: Player = {
    id,
    activeAction: actionId ? { actionId, progressMs: 0, durationMs: 3000 } : null,
    inventory: {},
    skills: {},
    updatedAt,
  }
  return { player, receivedAt: 0, replacedLostSave }
}

describe('keepNewest', () => {
  it('takes the first snapshot', () => {
    const next = snap('2026-11-05T12:00:00Z', 'cut-pine')

    expect(keepNewest(undefined, next)).toBe(next)
  })

  it('keeps newer server state when an older response arrives late', () => {
    const afterStop = snap('2026-11-05T12:00:05Z', null)
    const latePoll = snap('2026-11-05T12:00:04Z', 'cut-pine')

    expect(keepNewest(afterStop, latePoll)).toBe(afterStop)
  })

  it('accepts newer server state', () => {
    const previous = snap('2026-11-05T12:00:00Z', 'cut-pine')
    const next = snap('2026-11-05T12:00:03Z', 'cut-pine')

    expect(keepNewest(previous, next).player).toBe(next.player)
  })

  it('keeps the lost-save notice for the rest of the session', () => {
    const previous = snap('2026-11-05T12:00:00Z', null, 'p1', true)
    const next = snap('2026-11-05T12:00:03Z', null)

    expect(keepNewest(previous, next).replacedLostSave).toBe(true)
  })

  it('replaces the snapshot when the player itself changed', () => {
    const previous = snap('2026-11-05T12:00:09Z', 'cut-pine', 'old')
    const next = snap('2026-11-05T12:00:01Z', null, 'new')

    expect(keepNewest(previous, next)).toBe(next)
  })
})
