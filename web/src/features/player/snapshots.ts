import type { Player } from '../../api/client'

/** A server snapshot plus the moment it arrived, so the bar can animate from it. */
export interface PlayerSnapshot {
  player: Player
  receivedAt: number
  /** True when a stored player no longer existed on the server and a new one was created. */
  replacedLostSave: boolean
}

export function snapshot(player: Player, replacedLostSave = false): PlayerSnapshot {
  return { player, receivedAt: performance.now(), replacedLostSave }
}

/**
 * Responses can arrive out of order (a slow poll finishing after an action). The server stamps
 * every state with `updatedAt`, so the newest server state always wins, whatever arrived last.
 */
export function keepNewest(previous: PlayerSnapshot | undefined, next: PlayerSnapshot): PlayerSnapshot {
  if (!previous || previous.player.id !== next.player.id) return next

  const merged = previous.replacedLostSave ? { ...next, replacedLostSave: true } : next
  return Date.parse(next.player.updatedAt) < Date.parse(previous.player.updatedAt) ? previous : merged
}
