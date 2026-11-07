import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ActionBlockedError, useStartAction } from './queries'

const fetchMock = vi.hoisted(() => vi.fn<(request: Request) => Promise<Response>>())

// The real client uses a relative base URL, which only a browser can resolve; this one answers from the fake.
vi.mock('../../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/client')>()
  const { default: createClient } = await import('openapi-fetch')
  const api = createClient({ baseUrl: 'http://localhost/api', fetch: (request) => fetchMock(request) })
  return { ...original, api: api as typeof original.api }
})

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('a command the game refuses', () => {
  it('fails with the reason the server gave', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 409, title: 'Not enough materials.', reason: 'missing-inputs' }), {
        status: 409,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    )
    const { result } = renderHook(() => useStartAction('a-hold'), { wrapper })

    act(() => result.current.mutate('craft-chipped-stone-axe'))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ActionBlockedError)
    expect((result.current.error as ActionBlockedError).reason).toBe('missing-inputs')
  })
})
