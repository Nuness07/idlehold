import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Player } from '../../api/client'
import { applyServerState, playerQueryKey, type PlayerSnapshot } from './queries'

const hold = (id: string, updatedAt: string, actionId: string | null = null): Player => ({
  id,
  activeAction: actionId ? { actionId, progressMs: 0, durationMs: 3000 } : null,
  inventory: {},
  skills: {},
  tools: [],
  storage: { slotCount: 48, stackSize: 10_000, slots: [] },
  updatedAt,
})

const shown = (client: QueryClient) => client.getQueryData<PlayerSnapshot>(playerQueryKey)?.player

describe('a command answer', () => {
  it('updates the hold it was sent for', () => {
    const client = new QueryClient()
    client.setQueryData<PlayerSnapshot>(playerQueryKey, { player: hold('mine', '2026-11-07T12:00:00Z'), receivedAt: 0 })

    applyServerState(client, hold('mine', '2026-11-07T12:00:05Z', 'cut-pine'))

    expect(shown(client)?.activeAction?.actionId).toBe('cut-pine')
  })

  it('is dropped when the session switched to another hold while it was in flight', () => {
    const client = new QueryClient()
    const account = hold('account', '2026-11-07T12:00:00Z')
    client.setQueryData<PlayerSnapshot>(playerQueryKey, { player: account, receivedAt: 0 })

    applyServerState(client, hold('old-guest', '2026-11-07T12:00:09Z', 'cut-pine'))

    expect(shown(client)).toBe(account)
  })

  it('is dropped while the next session has no hold loaded yet', () => {
    const client = new QueryClient()

    applyServerState(client, hold('old-guest', '2026-11-07T12:00:09Z'))

    expect(shown(client)).toBeUndefined()
  })
})
