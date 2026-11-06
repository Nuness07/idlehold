import { useEffect, useRef } from 'react'
import type { ActiveAction } from '../../api/client'

/** A small grace period so the server's clock has passed the cycle boundary before we ask. */
const BOUNDARY_GRACE_MS = 150

/**
 * Animates the working action's bar locally, from the last server snapshot, and asks the server
 * for the confirmed result when a cycle ends. Rewards only appear once the server has counted them.
 *
 * The two jobs use different clocks on purpose: the bar draws with requestAnimationFrame (which
 * browsers pause in background tabs, and that is fine for a bar nobody sees), while the end of the
 * cycle is a timer, which keeps running in a background tab so the page title stays current.
 */
export function useCycleProgress(
  active: ActiveAction | null,
  receivedAt: number,
  onCycleComplete: () => void,
) {
  const barRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onCycleComplete)

  useEffect(() => {
    onCompleteRef.current = onCycleComplete
  }, [onCycleComplete])

  // Draw the bar.
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    if (!active) {
      bar.style.setProperty('--progress', '0')
      return
    }

    const { progressMs, durationMs } = active
    const loop = { frame: 0 }
    const draw = () => {
      const elapsed = progressMs + (performance.now() - receivedAt)
      bar.style.setProperty('--progress', String((elapsed % durationMs) / durationMs))
      loop.frame = requestAnimationFrame(draw)
    }

    loop.frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(loop.frame)
  }, [active, receivedAt])

  // Ask the server when the current cycle ends.
  useEffect(() => {
    if (!active) return

    const elapsedSinceSnapshot = performance.now() - receivedAt
    const remaining = active.durationMs - active.progressMs - elapsedSinceSnapshot
    const timer = window.setTimeout(() => onCompleteRef.current(), Math.max(0, remaining) + BOUNDARY_GRACE_MS)
    return () => window.clearTimeout(timer)
  }, [active, receivedAt])

  return barRef
}
