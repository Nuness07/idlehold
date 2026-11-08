import { describe, expect, it } from 'vitest'
import type { Player } from '../../api/client'
import { keepNewest, type PlayerSnapshot } from './snapshots'

function snap(updatedAt: string, actionId: string | null, id = 'p1'): PlayerSnapshot {
  const player: Player = {
    id,
    activeAction: actionId ? { actionId, progressMs: 0, durationMs: 3000 } : null,
    inventory: {},
    skills: {},
    tools: [],
  storage: { slotCount: 48, stackSize: 10_000, slots: [] },
    updatedAt,
  }
  return { player, receivedAt: 0 }
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

  it('replaces the snapshot when the player itself changed', () => {
    const previous = snap('2026-11-05T12:00:09Z', 'cut-pine', 'old')
    const next = snap('2026-11-05T12:00:01Z', null, 'new')

    expect(keepNewest(previous, next)).toBe(next)
  })
})
