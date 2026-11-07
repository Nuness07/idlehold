import { describe, expect, it } from 'vitest'
import { ApiError, createApi } from './client'

const answering = (response: Response) =>
  createApi({ baseUrl: 'http://localhost/api', fetch: async () => response })

describe('the API client', () => {
  it('returns the data of a success', async () => {
    const api = answering(new Response(JSON.stringify({ email: null, isGuest: true }), { status: 200 }))

    const { data } = await api.GET('/account/me')

    expect(data).toEqual({ email: null, isGuest: true })
  })

  it('throws an ApiError with the problem the server sent', async () => {
    const api = answering(new Response(JSON.stringify({ title: 'Refused', reason: 'missing-inputs' }), { status: 409 }))

    const error = await api.DELETE('/me/player/action').catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, problem: { reason: 'missing-inputs' }, message: 'Refused' })
  })

  it('throws an ApiError even when the error has no JSON body', async () => {
    const api = answering(new Response('Bad gateway', { status: 502 }))

    const error = await api.GET('/me/player').catch((thrown: unknown) => thrown)

    expect(error).toMatchObject({ status: 502, problem: {} })
  })
})
