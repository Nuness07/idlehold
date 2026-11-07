import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isApiError } from '../../api/client'
import { useStartAction, useStopAction } from './queries'

const fetchMock = vi.hoisted(() => vi.fn<(request: Request) => Promise<Response>>())

// The real client uses a relative base URL, which only a browser can resolve; this one answers from the fake.
vi.mock('../../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/client')>()
  return { ...original, api: original.createApi({ baseUrl: 'http://localhost/api', fetch: (request) => fetchMock(request) }) }
})

const problem = (status: number, body: object) =>
  new Response(JSON.stringify({ status, ...body }), { status, headers: { 'Content-Type': 'application/problem+json' } })

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => fetchMock.mockReset())

describe('a command the game refuses', () => {
  it('fails with the reason the server gave', async () => {
    fetchMock.mockResolvedValue(problem(409, { title: 'Not enough materials.', reason: 'missing-inputs' }))
    const { result } = renderHook(() => useStartAction('a-hold'), { wrapper })

    act(() => result.current.mutate('craft-chipped-stone-axe'))
    await waitFor(() => expect(result.current.isError).toBe(true))

    const error = result.current.error
    expect(isApiError(error, 409) && error.problem.reason).toBe('missing-inputs')
  })
})

describe.each([
  ['start', (holdId: string) => useStartAction(holdId), (hook: ReturnType<typeof useStartAction>) => hook.mutate('cut-pine')],
  ['stop', (holdId: string) => useStopAction(holdId), (hook: ReturnType<typeof useStopAction>) => hook.mutate()],
] as const)('the %s command', (_name, useCommand, send) => {
  it('forgets its error when another hold loads', async () => {
    fetchMock.mockResolvedValue(problem(401, { title: 'Unauthorized' }))
    const { result, rerender } = renderHook(({ holdId }) => useCommand(holdId), {
      wrapper,
      initialProps: { holdId: 'old-guest' },
    })

    act(() => send(result.current as never))
    await waitFor(() => expect(isApiError(result.current.error, 401)).toBe(true))

    rerender({ holdId: 'account' })
    expect(result.current.error).toBeNull()
  })
})
