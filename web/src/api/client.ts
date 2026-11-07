import createClient, { type ClientOptions, type Middleware } from 'openapi-fetch'
import type { components, paths } from './schema'

export type Player = components['schemas']['PlayerResponse']
export type Skill = components['schemas']['SkillResponse']
export type ActiveAction = components['schemas']['ActiveActionResponse']
export type GameAction = components['schemas']['ActionResponse']
export type Content = components['schemas']['ContentResponse']
export type Account = components['schemas']['AccountResponse']
export type ToolProgress = components['schemas']['ToolProgressResponse']

/** The body of an error answer (RFC 9457 problem details), with the fields this API adds. */
export interface Problem {
  title?: string
  /** A refused command's stable code, such as `missing-inputs`. */
  reason?: string
  /** A validation problem's messages per request field. */
  errors?: Record<string, string[]>
}

/** Any answer that is not a success. The screen reacts to `status`; `problem` says why, when the server said. */
export class ApiError extends Error {
  readonly status: number
  readonly problem: Problem

  constructor(status: number, problem: Problem) {
    super(problem.title ?? `The API answered ${status}.`)
    this.status = status
    this.problem = problem
  }
}

/** Whether `error` is the API answering with `status` (401: no session, 409: the game refused, …). */
export const isApiError = (error: unknown, status: number): error is ApiError =>
  error instanceof ApiError && error.status === status

/**
 * Turns every error answer into a thrown {@link ApiError}. openapi-fetch returns errors as values,
 * but React Query only treats a thrown error as a failure, so this does it once for every request:
 * a call that returns has succeeded and has its `data`.
 */
const throwOnError: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return
    const problem: Problem = await response
      .clone()
      .json()
      .catch(() => ({}))
    throw new ApiError(response.status, problem)
  },
}

/** Builds the typed client. Tests call it with their own `fetch`. */
export function createApi(options: ClientOptions) {
  const client = createClient<paths>(options)
  client.use(throwOnError)
  return client
}

/** Typed client for the IdleHold API. In development Vite proxies /api to the .NET server. */
export const api = createApi({ baseUrl: import.meta.env.VITE_API_URL ?? '/api' })
