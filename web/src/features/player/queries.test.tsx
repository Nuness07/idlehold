import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useStartAction, useStopAction, type PlayerMode } from './queries'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe.each([
  ['start', (mode: PlayerMode) => useStartAction(mode, undefined), (hook: ReturnType<typeof useStartAction>) => hook.mutate('cut-pine')],
  ['stop', (mode: PlayerMode) => useStopAction(mode, undefined), (hook: ReturnType<typeof useStopAction>) => hook.mutate()],
] as const)('the %s command', (_name, useCommand, send) => {
  it('forgets its error when the player signs in or out', async () => {
    const { result, rerender } = renderHook(({ mode }) => useCommand(mode), {
      wrapper,
      initialProps: { mode: 'account' as PlayerMode },
    })

    // Without a loaded hold the command fails before reaching the network.
    act(() => send(result.current as never))
    await waitFor(() => expect(result.current.isError).toBe(true))

    rerender({ mode: 'guest' })
    expect(result.current.error).toBeNull()
  })
})
