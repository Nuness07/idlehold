import { useState } from 'react'
import type { Skill } from '../../api/client'
import { readStorage, writeStorage } from '../../lib/storage'

const DISMISSED_KEY = 'idlehold.saveNudgeDismissed'

/** A guest has something to lose once any trade has risen past level 1. */
export function hasProgressWorthSaving(skills: Record<string, Skill>): boolean {
  return Object.values(skills).some((skill) => skill.level > 1)
}

/** Whether the player dismissed the nudge. The choice is kept, so it does not return on every visit. */
export function useNudgeDismissed(): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(() => readStorage(DISMISSED_KEY) === 'true')
  const dismiss = () => {
    writeStorage(DISMISSED_KEY, 'true')
    setDismissed(true)
  }
  return [dismissed, dismiss]
}
