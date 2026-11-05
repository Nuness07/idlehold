import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Content, type Player } from '../../api/client'
import { readStorage, writeStorage } from '../../lib/storage'

const PLAYER_ID_KEY = 'idlehold.playerId'

/** A server snapshot plus the moment it arrived, so the bar can animate from it. */
export interface PlayerSnapshot {
  player: Player
  receivedAt: number
  /** True when a stored player no longer existed on the server and a new one was created. */
  replacedLostSave: boolean
}

export const playerQueryKey = ['player'] as const

function snapshot(player: Player, replacedLostSave = false): PlayerSnapshot {
  return { player, receivedAt: performance.now(), replacedLostSave }
}

async function loadOrCreatePlayer(): Promise<PlayerSnapshot> {
  const storedId = readStorage(PLAYER_ID_KEY)
  let lost = false

  if (storedId) {
    const { data, response } = await api.GET('/players/{playerId}', {
      params: { path: { playerId: storedId } },
    })
    if (data) return snapshot(data)
    if (response.status !== 404) throw new Error(`Loading the hold failed (${response.status}).`)
    lost = true
  }

  const { data, response } = await api.POST('/players')
  if (!data) throw new Error(`Creating a hold failed (${response.status}).`)
  writeStorage(PLAYER_ID_KEY, data.id)
  return snapshot(data, lost)
}

export function usePlayer() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: playerQueryKey,
    queryFn: async () => {
      const next = await loadOrCreatePlayer()
      // Once a lost save was replaced, keep saying so for the rest of the session.
      const previous = queryClient.getQueryData<PlayerSnapshot>(playerQueryKey)
      return previous?.replacedLostSave ? { ...next, replacedLostSave: true } : next
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
    mutationFn: async (actionId: string) => {
      if (!playerId) throw new Error('No hold loaded yet.')
      const { data, response } = await api.POST('/players/{playerId}/action', {
        params: { path: { playerId } },
        body: { actionId },
      })
      if (!data) throw new Error(`Starting the action failed (${response.status}).`)
      return data
    },
    onSuccess: (player) => queryClient.setQueryData(playerQueryKey, snapshot(player)),
  })
}

export function useStopAction(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!playerId) throw new Error('No hold loaded yet.')
      const { data, response } = await api.DELETE('/players/{playerId}/action', {
        params: { path: { playerId } },
      })
      if (!data) throw new Error(`Stopping the action failed (${response.status}).`)
      return data
    },
    onSuccess: (player) => queryClient.setQueryData(playerQueryKey, snapshot(player)),
  })
}
