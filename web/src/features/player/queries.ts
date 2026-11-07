import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type Content, type Player } from '../../api/client'
import { keepNewest, snapshot, type PlayerSnapshot } from './snapshots'

export type { PlayerSnapshot } from './snapshots'

/** The hold of whoever the session cookie names, a guest or an account. The browser never holds its id. */
export const playerQueryKey = ['player'] as const

/**
 * The game refused a command (409), for example a recipe without its materials. `reason` is the
 * server's stable code (`missing-inputs`, `tool-already-owned`); the screen translates it.
 */
export class ActionBlockedError extends Error {
  readonly reason: string | undefined

  constructor(reason: string | undefined) {
    super(`The game refused the command (${reason ?? 'no reason given'}).`)
    this.reason = reason
  }
}

/** The session cookie expired or was revoked while playing. */
export class SessionEndedError extends Error {
  constructor() {
    super('The session ended.')
  }
}

async function loadMine(): Promise<PlayerSnapshot> {
  const { data, response } = await api.GET('/me/player')
  if (response.status === 401) throw new SessionEndedError()
  if (!data) throw new Error(`Loading the hold failed (${response.status}).`)
  return snapshot(data)
}

/**
 * A command's answer only updates the hold it was sent for. If the session changed while it was in
 * flight (signed in, signed out), the screen now shows another hold, or none yet; the late answer
 * belongs to a hold that is gone, so it is dropped.
 */
export function applyServerState(queryClient: QueryClient, player: Player): void {
  const current = queryClient.getQueryData<PlayerSnapshot>(playerQueryKey)
  if (current?.player.id !== player.id) return
  queryClient.setQueryData<PlayerSnapshot>(playerQueryKey, keepNewest(current, snapshot(player)))
}

/** @param ready `false` until the session is known; nothing loads before there is one. */
export function usePlayer(ready: boolean) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: playerQueryKey,
    queryFn: async () => keepNewest(queryClient.getQueryData<PlayerSnapshot>(playerQueryKey), await loadMine()),
    enabled: ready,
    // On signing in or out the hold is reloaded; the last one stays on screen until the next one
    // arrives, instead of flashing the loading screen.
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.error instanceof SessionEndedError ? false : 30_000),
    // Keep polling in a background tab: that is where idle players leave the game.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => !(error instanceof SessionEndedError) && failureCount < 2,
  })
}

export function useContent() {
  return useQuery({
    queryKey: ['content'],
    queryFn: async (): Promise<Content> => {
      const { data, response } = await api.GET('/content')
      if (!data) throw new Error(`Loading game content failed (${response.status}).`)
      return data
    },
    staleTime: Infinity,
  })
}

type Sent = Promise<{ data?: Player; error?: unknown; response: Response }>

async function command(holdId: string | undefined, send: () => Sent): Promise<Player> {
  if (!holdId) throw new Error('No hold loaded yet.')
  const { data, error, response } = await send()
  if (response.status === 401) throw new SessionEndedError()
  if (response.status === 409) throw new ActionBlockedError(reasonOf(error))
  if (!data) throw new Error(`The command failed (${response.status}).`)
  return data
}

/**
 * Command errors belong to the hold that produced them. Keying each command by the hold resets it
 * when another one loads (signing in or out), so an old 401 cannot keep the app thinking the session
 * just ended.
 */
const commandKey = (name: 'start' | 'stop', holdId: string | undefined) => ['command', name, holdId] as const

/** @param holdId The hold on screen; commands wait until one has loaded. */
export function useStartAction(holdId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: commandKey('start', holdId),
    // A read already in flight would carry the state from before this action.
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: (actionId: string) => command(holdId, () => api.POST('/me/player/action', { body: { actionId } })),
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}

export function useStopAction(holdId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: commandKey('stop', holdId),
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: () => command(holdId, () => api.DELETE('/me/player/action')),
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}

function reasonOf(problem: unknown): string | undefined {
  if (typeof problem !== 'object' || problem === null || !('reason' in problem)) return undefined
  return typeof problem.reason === 'string' ? problem.reason : undefined
}
