import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, isApiError, type Content, type Player } from '../../api/client'
import { keepNewest, snapshot, type PlayerSnapshot } from './snapshots'

export type { PlayerSnapshot } from './snapshots'

/** The hold of whoever the session cookie names, a guest or an account. The browser never holds its id. */
export const playerQueryKey = ['player'] as const

/** A 401: the session expired or was revoked. Neither a retry nor a poll can fix it. */
export const isSessionEnded = (error: Error | null) => isApiError(error, 401)

/** @param ready `false` until the session is known; nothing loads before there is one. */
export function usePlayer(ready: boolean) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: playerQueryKey,
    queryFn: async () => {
      const { data } = await api.GET('/me/player')
      return keepNewest(queryClient.getQueryData<PlayerSnapshot>(playerQueryKey), snapshot(data!))
    },
    enabled: ready,
    // On signing in or out the hold is reloaded; the last one stays on screen until the next one
    // arrives, instead of flashing the loading screen.
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (isSessionEnded(query.state.error) ? false : 30_000),
    // Keep polling in a background tab: that is where idle players leave the game.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => !isSessionEnded(error) && failureCount < 2,
  })
}

export function useContent() {
  return useQuery({
    queryKey: ['content'],
    queryFn: async (): Promise<Content> => (await api.GET('/content')).data!,
    staleTime: Infinity,
  })
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

// Commands are keyed by the hold on screen: when another hold loads (signing in or out), the key
// changes and React Query clears the old error, so an old 401 cannot outlive its session.
// Before sending, they cancel any read in flight, which would carry the state from before the command.

export function useStartAction(holdId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['command', 'start', holdId],
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: async (actionId: string) => (await api.POST('/me/player/action', { body: { actionId } })).data!,
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}

export function useStopAction(holdId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['command', 'stop', holdId],
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: async () => (await api.DELETE('/me/player/action')).data!,
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}
