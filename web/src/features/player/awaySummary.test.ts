import { beforeEach, describe, expect, it } from 'vitest'
import type { Player } from '../../api/client'
import { rememberLastSeen, summarizeAway } from './awaySummary'

function player(logs: number, level: number): Player {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    activeAction: null,
    inventory: logs > 0 ? { 'pine-log': logs } : {},
    skills: { woodcutting: { xp: logs * 10, level, levelStartXp: 0, nextLevelXp: 100 } },
    tools: [],
    updatedAt: '2026-11-05T12:00:00Z',
  }
}

const HOUR = 3_600_000

describe('summarizeAway', () => {
  beforeEach(() => window.localStorage.clear())

  it('says nothing on the first visit', () => {
    expect(summarizeAway(player(10, 1), 0)).toBeNull()
  })

  it('lists items and levels gained while away', () => {
    rememberLastSeen(player(10, 1), 0)

    const summary = summarizeAway(player(9850, 15), 8 * HOUR)

    expect(summary).toEqual({
      awayMs: 8 * HOUR,
      items: [{ itemId: 'pine-log', gained: 9840 }],
      levels: [{ skillId: 'woodcutting', gained: 14, level: 15 }],
    })
  })

  it('ignores a quick reload', () => {
    rememberLastSeen(player(10, 1), 0)

    expect(summarizeAway(player(12, 1), 20_000)).toBeNull()
  })

  it('says nothing when nothing changed', () => {
    rememberLastSeen(player(10, 1), 0)

    expect(summarizeAway(player(10, 1), HOUR)).toBeNull()
  })
})
