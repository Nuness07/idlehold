import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type Account } from '../../api/client'
import { playerQueryRoot, rememberPlayerId } from '../player/queries'

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

export interface AccountState {
  /** `false` when the server runs without a database: it has no accounts and everyone is a guest. */
  enabled: boolean
  /** The signed-in account, or `null` for a guest. */
  account: Account | null
}

export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: async (): Promise<AccountState> => {
      const { data, response } = await api.GET('/account/me')
      if (data) return { enabled: true, account: data }
      if (response.status === 401) return { enabled: true, account: null }
      if (response.status === 404) return { enabled: false, account: null }
      throw new Error(`Loading the account failed (${response.status}).`)
    },
    staleTime: Infinity,
    retry: 2,
  })
}

/** Switches the screen to another owner: the old hold is dropped and the new one loads fresh. */
export function switchAccount(queryClient: QueryClient, account: Account | null): void {
  queryClient.removeQueries({ queryKey: playerQueryRoot })
  queryClient.setQueryData<AccountState>(accountQueryKey, { enabled: true, account })
}

interface Credentials {
  email: string
  password: string
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password, guestPlayerId }: Credentials & { guestPlayerId: string | null }) => {
      const { data, error } = await api.POST('/account/register', { body: { email, password, guestPlayerId } })
      if (data) return data
      throw new AccountError(problemsFromValidation(error?.errors))
    },
    onSuccess: (account) => {
      rememberPlayerId(account.playerId)
      switchAccount(queryClient, account)
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, response } = await api.POST('/account/login', { body: { email, password } })
      if (data) return data
      // One answer for every refused sign-in: the server does not say which part was wrong.
      throw new AccountError([response.status === 401 ? 'login' : 'failed'])
    },
    onSuccess: (account) => {
      rememberPlayerId(account.playerId)
      switchAccount(queryClient, account)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { response } = await api.POST('/account/logout')
      if (!response.ok) throw new Error(`Signing out failed (${response.status}).`)
    },
    // The browser keeps the hold's id, so the guest view finds an owned hold and asks to sign in.
    onSuccess: () => switchAccount(queryClient, null),
  })
}
