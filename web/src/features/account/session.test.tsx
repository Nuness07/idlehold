import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAccount } from './queries'

const fetchMock = vi.hoisted(() => vi.fn<(request: Request) => Promise<Response>>())
const seen = vi.hoisted(() => [] as string[])

// The real client uses a relative base URL, which only a browser can resolve; this one answers from the fake.
vi.mock('../../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/client')>()
  const fetch = (request: Request) => {
    seen.push(`${request.method} ${new URL(request.url).pathname}`)
    return fetchMock(request)
  }
  return { ...original, api: original.createApi({ baseUrl: 'http://localhost/api', fetch }) }
})

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('the session', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    seen.length = 0
  })

  it('starts a guest session on a first visit', async () => {
    fetchMock.mockResolvedValueOnce(json(401)).mockResolvedValueOnce(json(200, { email: null, isGuest: true }))

    const { result } = renderHook(() => useAccount(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual({ email: null, isGuest: true }))
    expect(seen).toEqual(['GET /api/account/me', 'POST /api/account/guest'])
  })

  it('keeps the session the browser already has', async () => {
    fetchMock.mockResolvedValue(json(200, { email: 'ana@example.test', isGuest: false }))

    const { result } = renderHook(() => useAccount(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual({ email: 'ana@example.test', isGuest: false }))
    expect(seen).toEqual(['GET /api/account/me'])
  })
})
