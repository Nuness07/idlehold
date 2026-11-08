import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { applyServerState, playerQueryKey } from '../player/queries'

/** One edit of the development tools (GM mode). The server applies it to the session's hold. */
export type DevEdit =
  | { kind: 'level'; skillId: string; level: number }
  | { kind: 'items'; itemId: string; count: number }
  | { kind: 'advance'; minutes: number }
  | { kind: 'reset' }

async function send(edit: DevEdit) {
  switch (edit.kind) {
    case 'level':
      return (
        await api.PUT('/dev/player/skills/{skillId}', {
          params: { path: { skillId: edit.skillId } },
          body: { level: edit.level },
        })
      ).data!
    case 'items':
      return (
        await api.PUT('/dev/player/items/{itemId}', {
          params: { path: { itemId: edit.itemId } },
          body: { count: edit.count },
        })
      ).data!
    case 'advance':
      return (await api.POST('/dev/player/advance', { body: { minutes: edit.minutes } })).data!
    case 'reset':
      return (await api.POST('/dev/player/reset')).data!
  }
}

/** Sends an edit and shows the hold the server answers with, like a game command. */
export function useDevEdit(holdId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['command', 'dev', holdId],
    onMutate: () => queryClient.cancelQueries({ queryKey: playerQueryKey }),
    mutationFn: send,
    onSuccess: (player) => applyServerState(queryClient, player),
  })
}
