import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type Content, type Player } from '../../api/client'
import { readStorage, writeStorage } from '../../lib/storage'
import { keepNewest, snapshot, type PlayerSnapshot } from './snapshots'

export type { PlayerSnapshot } from './snapshots'

const PLAYER_ID_KEY = 'idlehold.playerId'

/**
 * The current player's id for this page session. localStorage only persists it across visits;
 * when storage is blocked, this keeps polls and refetches on the same hold.
 */
let sessionPlayerId: string | null = null

function rememberPlayerId(id: string): void {
  sessionPlayerId = id
  writeStorage(PLAYER_ID_KEY, id)
}

export const playerQueryKey = ['player'] as const

async function loadOrCreatePlayer(): Promise<PlayerSnapshot> {
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
    if (response.status !== 404) throw new Error(`Loading the hold failed (${response.status}).`)
    lost = true
  }

  const { data, response } = await api.POST('/players')
  if (!data) throw new Error(`Creating a hold failed (${response.status}).`)
  rememberPlayerId(data.id)
  return snapshot(data, lost)
}

function applyServerState(queryClient: QueryClient, player: Player): void {
  queryClient.setQueryData<PlayerSnapshot>(playerQueryKey, (previous) => keepNewest(previous, snapshot(player)))
}

export function usePlayer() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: playerQueryKey,
    queryFn: async () => {
      const next = await loadOrCreatePlayer()
      return keepNewest(queryClient.getQueryData<PlayerSnapshot>(playerQueryKey), next)
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 2,
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

export function useStartAction(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    // A read already in flight would carry the state from before this action.
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: async (actionId: string) => {
      if (!playerId) throw new Error('No hold loaded yet.')
      const { data, response } = await api.POST('/players/{playerId}/action', {
        params: { path: { playerId } },
        body: { actionId },
      })
      if (!data) throw new Error(`Starting the action failed (${response.status}).`)
      return data
    },
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}

export function useStopAction(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: async () => {
      if (!playerId) throw new Error('No hold loaded yet.')
      const { data, response } = await api.DELETE('/players/{playerId}/action', {
        params: { path: { playerId } },
      })
      if (!data) throw new Error(`Stopping the action failed (${response.status}).`)
      return data
    },
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}
