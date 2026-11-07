import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type Account } from '../../api/client'
import { playerQueryKey } from '../player/queries'

export const accountQueryKey = ['account'] as const

/** What went wrong with a sign-up or sign-in, as the form shows it. */
export type AccountProblem = 'email' | 'password' | 'login' | 'failed'

export class AccountError extends Error {
  readonly problems: AccountProblem[]

  constructor(problems: AccountProblem[]) {
    super(`Account request failed: ${problems.join(', ')}`)
    this.problems = problems
  }
}

/** The fields the API's validation problem names, turned into what the form shows. */
export function problemsFromValidation(errors: Record<string, string[]> | undefined): AccountProblem[] {
  const problems: AccountProblem[] = []
  if (errors?.email) problems.push('email')
  if (errors?.password) problems.push('password')
  return problems.length > 0 ? problems : ['failed']
}

/**
 * Who this browser plays as. A first visit has no session, so it starts one as a guest: the server
 * makes an anonymous account and sets the session cookie, and the client never sees a player id.
 */
export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: async (): Promise<Account> => {
      const me = await api.GET('/account/me')
      if (me.data) return me.data
      if (me.response.status !== 401) throw new Error(`Loading the session failed (${me.response.status}).`)

      const guest = await api.POST('/account/guest')
      if (guest.data) return guest.data
      throw new Error(`Starting a guest session failed (${guest.response.status}).`)
    },
    staleTime: Infinity,
    retry: 2,
  })
}

/** Switches the screen to another session: the old hold is dropped and the new one loads fresh. */
export function switchAccount(queryClient: QueryClient, account: Account): void {
  queryClient.removeQueries({ queryKey: playerQueryKey })
  queryClient.setQueryData<Account>(accountQueryKey, account)
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
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, error } = await api.POST('/account/register', { body: { email, password } })
      if (data) return data
      throw new AccountError(problemsFromValidation(error?.errors))
    },
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
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, response } = await api.POST('/account/login', { body: { email, password } })
      if (data) return data
      // One answer for every refused sign-in: the server does not say which part was wrong.
      throw new AccountError([response.status === 401 ? 'login' : 'failed'])
    },
    onSuccess: (account) => switchAccount(queryClient, account),
  })
}

/** Only accounts sign out (a guest would lose its hold for good); the browser then starts as a new guest. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { response } = await api.POST('/account/logout')
      if (!response.ok) throw new Error(`Signing out failed (${response.status}).`)
    },
    onSuccess: () => void endSession(queryClient),
  })
}
