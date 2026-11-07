import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, isApiError, type Account } from '../../api/client'
import { playerQueryKey } from '../player/queries'

const accountQueryKey = ['account'] as const

/** What went wrong with a sign-up or sign-in, as the form shows it. */
export type AccountProblem = 'email' | 'password' | 'login' | 'failed'

/**
 * A failed sign-up or sign-in, as the form shows it: the fields a validation problem (400) names,
 * a refused sign-in (401, which never says which part was wrong), or a general failure.
 */
export function formProblems(error: Error | null): AccountProblem[] {
  if (!error) return []
  if (isApiError(error, 401)) return ['login']
  const fields = isApiError(error, 400) ? (error.problem.errors ?? {}) : {}
  const problems: AccountProblem[] = []
  if (fields.email) problems.push('email')
  if (fields.password) problems.push('password')
  return problems.length > 0 ? problems : ['failed']
}

/**
 * Who this browser plays as. A first visit has no session (401), so it starts one as a guest: the
 * server makes an anonymous account and sets the session cookie, and the client never sees a player id.
 */
export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: async (): Promise<Account> => {
      try {
        return (await api.GET('/account/me')).data!
      } catch (error) {
        if (!isApiError(error, 401)) throw error
        return (await api.POST('/account/guest')).data!
      }
    },
    staleTime: Infinity,
    retry: 2,
  })
}

/** The session is gone (signed out or expired): forget it, which starts a new guest session. */
export function endSession(queryClient: QueryClient): Promise<void> {
  queryClient.removeQueries({ queryKey: playerQueryKey })
  return queryClient.resetQueries({ queryKey: accountQueryKey })
}

interface Credentials {
  email: string
  password: string
}

/** A guest that signs up keeps its hold: the server turns the guest's own account into a full one. */
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Credentials) => (await api.POST('/account/register', { body })).data!,
    // Same hold, so it stays on screen while it refreshes.
    onSuccess: (account) => {
      queryClient.setQueryData<Account>(accountQueryKey, account)
      void queryClient.invalidateQueries({ queryKey: playerQueryKey })
    },
  })
}

/** Signing in from a guest session opens the account's hold; the server deletes the guest's. */
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Credentials) => (await api.POST('/account/login', { body })).data!,
    // Another hold: drop the guest's and load the account's fresh.
    onSuccess: (account) => {
      queryClient.removeQueries({ queryKey: playerQueryKey })
      queryClient.setQueryData<Account>(accountQueryKey, account)
    },
  })
}

/** Only accounts sign out (a guest would lose its hold for good); the browser then starts as a new guest. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.POST('/account/logout'),
    onSuccess: () => endSession(queryClient),
  })
}
