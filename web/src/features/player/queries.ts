import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type Content, type Player } from '../../api/client'
import { readStorage, removeStorage, writeStorage } from '../../lib/storage'
import { keepNewest, snapshot, type PlayerSnapshot } from './snapshots'

export type { PlayerSnapshot } from './snapshots'

const PLAYER_ID_KEY = 'idlehold.playerId'

/**
 * The current player's id for this page session. localStorage only persists it across visits;
 * when storage is blocked, this keeps polls and refetches on the same hold.
 */
let sessionPlayerId: string | null = null

export function rememberPlayerId(id: string): void {
  sessionPlayerId = id
  writeStorage(PLAYER_ID_KEY, id)
}

function forgetPlayerId(): void {
  sessionPlayerId = null
  removeStorage(PLAYER_ID_KEY)
}

/** Who the hold is played as: a guest (the id is the key) or the signed-in account (the session cookie). */
export type PlayerMode = 'guest' | 'account'

export const playerQueryRoot = ['player'] as const

export const playerQueryKey = (mode: PlayerMode) => [...playerQueryRoot, mode] as const

/** The browser's hold belongs to an account now, so only signing in opens it. */
export class HoldOwnedError extends Error {
  constructor() {
    super('This hold belongs to an account.')
  }
}

/** The session cookie expired or was revoked while playing. */
export class SessionEndedError extends Error {
  constructor() {
    super('The session ended.')
  }
}

/** Errors that neither a retry nor a poll can fix: the player has to sign in. */
export const needsSignIn = (error: Error | null) =>
  error instanceof HoldOwnedError || error instanceof SessionEndedError

async function loadOrCreateGuest(): Promise<PlayerSnapshot> {
  const knownId = sessionPlayerId ?? readStorage(PLAYER_ID_KEY)
  let lost = false

  if (knownId) {
    const { data, response } = await api.GET('/players/{playerId}', {
      params: { path: { playerId: knownId } },
    })
    if (data) {
      rememberPlayerId(data.id)
      return snapshot(data)
    }
    if (response.status === 403) throw new HoldOwnedError()
    if (response.status !== 404) throw new Error(`Loading the hold failed (${response.status}).`)
    lost = true
  }

  const { data, response } = await api.POST('/players')
  if (!data) throw new Error(`Creating a hold failed (${response.status}).`)
  rememberPlayerId(data.id)
  return snapshot(data, lost)
}

async function loadMine(): Promise<PlayerSnapshot> {
  const { data, response } = await api.GET('/me/player')
  if (response.status === 401) throw new SessionEndedError()
  if (!data) throw new Error(`Loading the hold failed (${response.status}).`)
  // Kept so that, after signing out, this browser knows the hold is an account's.
  rememberPlayerId(data.id)
  return snapshot(data)
}

function applyServerState(queryClient: QueryClient, mode: PlayerMode, player: Player): void {
  queryClient.setQueryData<PlayerSnapshot>(playerQueryKey(mode), (previous) => keepNewest(previous, snapshot(player)))
}

/** @param mode `undefined` while it is not known yet whether someone is signed in; nothing loads until then. */
export function usePlayer(mode: PlayerMode | undefined) {
  const queryClient = useQueryClient()
  const key = playerQueryKey(mode ?? 'guest')
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const next = await (mode === 'account' ? loadMine() : loadOrCreateGuest())
      return keepNewest(queryClient.getQueryData<PlayerSnapshot>(key), next)
    },
    enabled: mode !== undefined,
    // On signing in or out the key changes; the last hold stays on screen until the next one
    // arrives, instead of flashing the loading screen.
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (needsSignIn(query.state.error) ? false : 30_000),
    // Keep polling in a background tab: that is where idle players leave the game.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => !needsSignIn(error) && failureCount < 2,
  })
}

/** Forgets the browser's hold and starts a fresh guest one. */
export function useStartAsNewGuest() {
  const queryClient = useQueryClient()
  return () => {
    forgetPlayerId()
    void queryClient.resetQueries({ queryKey: playerQueryKey('guest') })
  }
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

type Sent = Promise<{ data?: Player; response: Response }>

/** Sends a command through the guest route or the signed-in route. */
async function command(
  mode: PlayerMode,
  playerId: string | undefined,
  send: { guest: (playerId: string) => Sent; account: () => Sent },
): Promise<Player> {
  if (!playerId) throw new Error('No hold loaded yet.')
  const { data, response } = await (mode === 'account' ? send.account() : send.guest(playerId))
  if (response.status === 401) throw new SessionEndedError()
  if (!data) throw new Error(`The command failed (${response.status}).`)
  return data
}

/**
 * Command errors belong to the session that produced them. Keying each command by mode resets it when
 * the player signs in or out, so an old 401 cannot keep the app thinking the session just ended.
 */
const commandKey = (name: 'start' | 'stop', mode: PlayerMode) => ['command', name, mode] as const

export function useStartAction(mode: PlayerMode, playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: commandKey('start', mode),
    // A read already in flight would carry the state from before this action.
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey(mode) }),
    mutationFn: (actionId: string) =>
      command(mode, playerId, {
        guest: (id) => api.POST('/players/{playerId}/action', { params: { path: { playerId: id } }, body: { actionId } }),
        account: () => api.POST('/me/player/action', { body: { actionId } }),
      }),
    onSuccess: (player) => applyServerState(queryClient, mode, player),
  })
}

export function useStopAction(mode: PlayerMode, playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: commandKey('stop', mode),
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey(mode) }),
    mutationFn: () =>
      command(mode, playerId, {
        guest: (id) => api.DELETE('/players/{playerId}/action', { params: { path: { playerId: id } } }),
        account: () => api.DELETE('/me/player/action'),
      }),
    onSuccess: (player) => applyServerState(queryClient, mode, player),
  })
}
