import type { Player } from '../../api/client'
import { readStorage, writeStorage } from '../../lib/storage'

const LAST_SEEN_KEY = 'idlehold.lastSeen'

/** Only absences longer than this get a summary; a quick reload is not "away". */
const MIN_AWAY_MS = 60_000

interface LastSeen {
  at: number
  inventory: Record<string, number>
  levels: Record<string, number>
}

export interface AwaySummary {
  awayMs: number
  items: { itemId: string; gained: number }[]
  levels: { skillId: string; gained: number; level: number }[]
}

function levelsOf(player: Player): Record<string, number> {
  return Object.fromEntries(Object.entries(player.skills).map(([id, skill]) => [id, skill.level]))
}

/** Records what the player has right now, so the next visit can say what changed. */
export function rememberLastSeen(player: Player, now = Date.now()): void {
  const value: LastSeen = { at: now, inventory: player.inventory, levels: levelsOf(player) }
  writeStorage(LAST_SEEN_KEY, JSON.stringify(value))
}

/** Compares the server's state with the last visit. Returns null when there is nothing to tell. */
export function summarizeAway(player: Player, now = Date.now()): AwaySummary | null {
  const raw = readStorage(LAST_SEEN_KEY)
  if (!raw) return null

  let lastSeen: LastSeen
  try {
    lastSeen = JSON.parse(raw) as LastSeen
  } catch {
    return null
  }

  const awayMs = now - lastSeen.at
  if (awayMs < MIN_AWAY_MS) return null

  const items = Object.entries(player.inventory)
    .map(([itemId, count]) => ({ itemId, gained: count - (lastSeen.inventory[itemId] ?? 0) }))
    .filter((item) => item.gained > 0)

  const levels = Object.entries(levelsOf(player))
    .map(([skillId, level]) => ({ skillId, level, gained: level - (lastSeen.levels[skillId] ?? 1) }))
    .filter((skill) => skill.gained > 0)

  if (items.length === 0 && levels.length === 0) return null
  return { awayMs, items, levels }
}
