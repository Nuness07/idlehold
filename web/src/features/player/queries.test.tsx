import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useStartAction, useStopAction } from './queries'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe.each([
  ['start', (holdId?: string) => useStartAction(holdId), (hook: ReturnType<typeof useStartAction>) => hook.mutate('cut-pine')],
  ['stop', (holdId?: string) => useStopAction(holdId), (hook: ReturnType<typeof useStopAction>) => hook.mutate()],
] as const)('the %s command', (_name, useCommand, send) => {
  it('forgets its error when another hold loads', async () => {
    const { result, rerender } = renderHook(({ holdId }) => useCommand(holdId), {
      wrapper,
      initialProps: { holdId: undefined as string | undefined },
    })

    // Without a loaded hold the command fails before reaching the network.
    act(() => send(result.current as never))
    await waitFor(() => expect(result.current.isError).toBe(true))

    rerender({ holdId: 'another-hold' })
    expect(result.current.error).toBeNull()
  })
})
