import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

/** Typed client for the IdleHold API. In development Vite proxies /api to the .NET server. */
export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL ?? '/api' })

export type Player = components['schemas']['PlayerResponse']
export type Skill = components['schemas']['SkillResponse']
export type ActiveAction = components['schemas']['ActiveActionResponse']
export type GameAction = components['schemas']['ActionResponse']
export type Content = components['schemas']['ContentResponse']
export type Account = components['schemas']['AccountResponse']
