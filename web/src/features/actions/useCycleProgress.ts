import { useEffect, useRef } from 'react'
import type { ActiveAction } from '../../api/client'

/**
 * Animates the working action's bar locally, from the last server snapshot.
 *
 * The bar is cosmetic: it writes a CSS variable on the element instead of re-rendering React
 * every frame. When a cycle completes, `onCycleComplete` asks the server for the confirmed
 * result; rewards only appear once the server has counted them.
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

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    if (!active) {
      bar.style.setProperty('--progress', '0')
      return
    }

    const { progressMs, durationMs } = active
    const loop = { frame: 0, requested: false }

    const draw = () => {
      const elapsed = progressMs + (performance.now() - receivedAt)
      bar.style.setProperty('--progress', String((elapsed % durationMs) / durationMs))

      // A small grace period lets the server's clock pass the boundary before we ask.
      if (!loop.requested && elapsed >= durationMs + 150) {
        loop.requested = true
        onCompleteRef.current()
      }
      loop.frame = requestAnimationFrame(draw)
    }

    loop.frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(loop.frame)
  }, [active, receivedAt])

  return barRef
}
