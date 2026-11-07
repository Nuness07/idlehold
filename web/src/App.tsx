import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Skill } from './api/client'
import { Button } from './components/Button'
import { LanguageSwitch } from './components/LanguageSwitch'
import { useContentText } from './content/text'
import { AccountDialog } from './features/account/AccountDialog'
import type { AccountFormMode } from './features/account/AccountForm'
import { AccountMenu } from './features/account/AccountMenu'
import { switchAccount, useAccount, useLogout } from './features/account/queries'
import { hasProgressWorthSaving, useNudgeDismissed } from './features/account/nudge'
import { SaveNudge } from './features/account/SaveNudge'
import { SignedOut } from './features/account/SignedOut'
import { ActionList } from './features/actions/ActionList'
import { WorkingAction } from './features/actions/WorkingAction'
import {
  ActionBlockedError,
  HoldOwnedError,
  playerQueryRoot,
  SessionEndedError,
  useContent,
  usePlayer,
  useStartAction,
  useStartAsNewGuest,
  useStopAction,
} from './features/player/queries'
import { SinceYouLeft } from './features/player/SinceYouLeft'
import { rememberLastSeen, summarizeAway, type AwaySummary } from './features/player/awaySummary'
import { Stores } from './features/stores/Stores'
import { TradeRail } from './features/trades/TradeRail'
import { TradeSign } from './features/trades/TradeSign'
import { VillageView } from './features/village/VillageView'
import { useFormat } from './lib/format'

/** A trade the player has not earned XP in yet. Its real level bounds arrive with the first XP. */
const untouchedSkill: Skill = { xp: 0, level: 1, levelStartXp: 0, nextLevelXp: null }

export default function App() {
  const { t } = useTranslation()
  const text = useContentText()
  const format = useFormat()
  const queryClient = useQueryClient()
  const content = useContent()
  const accountQuery = useAccount()
  const accountState = accountQuery.data
  const mode = accountState ? (accountState.account ? 'account' : 'guest') : undefined
  const playerQuery = usePlayer(mode)
  const snapshot = playerQuery.data
  const player = snapshot?.player

  const startAction = useStartAction(mode ?? 'guest', player?.id)
  const stopAction = useStopAction(mode ?? 'guest', player?.id)
  const commandError = startAction.error ?? stopAction.error

  /** A refusal from the game says why; anything else is a connection or server problem. */
  const commandErrorText = (error: Error) => {
    if (error instanceof ActionBlockedError) {
      if (error.reason === 'missing-inputs') return t('app.actionBlocked.missing-inputs')
      if (error.reason === 'tool-already-owned') return t('app.actionBlocked.tool-already-owned')
    }
    return t('app.actionFailed')
  }
  const logout = useLogout()
  const startAsNewGuest = useStartAsNewGuest()

  const [dialog, setDialog] = useState<AccountFormMode | null>(null)
  const [nudgeDismissed, dismissNudge] = useNudgeDismissed()

  const [away, setAway] = useState<AwaySummary | null>(null)
  const [swingKey, setSwingKey] = useState(0)
  const [freshItemId, setFreshItemId] = useState<string>()
  /** The trade the player chose to look at; until they choose, the screen follows the working trade. */
  const [viewedSkillId, setViewedSkillId] = useState<string>()
  /** The village is the home screen; choosing a trade leaves it, and the rail's Village entry comes back. */
  const [villageOpen, setVillageOpen] = useState(true)
  const summarized = useRef(false)
  const lastTotals = useRef<{ playerId: string; xp: number; levels: number } | null>(null)

  const actions = useMemo(() => content.data?.actions ?? [], [content.data])
  const skillIds = useMemo(() => [...new Set(actions.map((action) => action.skillId))], [actions])
  const activeAction = player?.activeAction ?? null
  const activeDefinition = actions.find((action) => action.id === activeAction?.actionId)
  const selectedSkillId = viewedSkillId ?? activeDefinition?.skillId ?? skillIds[0]

  // First load: tell the player what happened while they were away, then keep the record current.
  useEffect(() => {
    if (!player) return
    if (!summarized.current) {
      summarized.current = true
      setAway(summarizeAway(player))
    }
    rememberLastSeen(player)
  }, [player])

  // When the server confirms a reward the stored item is highlighted; a level-up also swings the sign.
  useEffect(() => {
    if (!player) return
    const skills = Object.values(player.skills)
    const totals = {
      playerId: player.id,
      xp: skills.reduce((sum, skill) => sum + skill.xp, 0),
      levels: skills.reduce((sum, skill) => sum + skill.level, 0),
    }
    const previous = lastTotals.current
    lastTotals.current = totals
    // A different hold (after signing in or out) is a new baseline, not a reward.
    if (previous === null || previous.playerId !== totals.playerId || totals.xp <= previous.xp) return

    if (totals.levels > previous.levels) setSwingKey((key) => key + 1)
    setFreshItemId(activeDefinition?.outputItemId)
    const timer = window.setTimeout(() => setFreshItemId(undefined), 900)
    return () => window.clearTimeout(timer)
  }, [player, activeDefinition?.outputItemId])

  // A background tab still says what is going on.
  useEffect(() => {
    if (!player || !activeDefinition) {
      document.title = 'IdleHold'
      return
    }
    const count = player.inventory[activeDefinition.outputItemId] ?? 0
    document.title = t('app.pageTitle', {
      count: format.count(count),
      item: text.itemCount(activeDefinition.outputItemId, count),
      verb: text.actionVerb(activeDefinition.id),
    })
  }, [player, activeDefinition, t, text, format])

  const refreshPlayer = useCallback(
    () => queryClient.invalidateQueries({ queryKey: playerQueryRoot }),
    [queryClient],
  )

  // The session ended while playing (expired, or signed out elsewhere): fall back to the guest view,
  // which finds the browser's hold owned and asks to sign in.
  const sessionEnded =
    playerQuery.error instanceof SessionEndedError ||
    startAction.error instanceof SessionEndedError ||
    stopAction.error instanceof SessionEndedError
  useEffect(() => {
    if (sessionEnded) switchAccount(queryClient, null)
  }, [sessionEnded, queryClient])

  // The browser's hold belongs to an account: there is no guest hold to save, only one to sign in to.
  const holdOwned = playerQuery.error instanceof HoldOwnedError
  const guestPlayer = mode === 'guest' && !holdOwned ? player : undefined
  const guestHasXp = guestPlayer ? Object.values(guestPlayer.skills).some((skill) => skill.xp > 0) : false
  const shell = (totalLevel: number | null, children: React.ReactNode) => (
    <Shell
      totalLevel={totalLevel}
      menu={
        accountState?.enabled && !holdOwned ? (
          <AccountMenu
            account={accountState.account}
            onSaveProgress={() => setDialog('register')}
            onSignOut={() => logout.mutate()}
            signingOut={logout.isPending}
          />
        ) : null
      }
    >
      {children}
      <AccountDialog
        mode={dialog}
        onModeChange={setDialog}
        onClose={() => setDialog(null)}
        guest={guestPlayer ? { playerId: guestPlayer.id, hasProgress: guestHasXp } : null}
      />
    </Shell>
  )

  if (holdOwned) {
    return shell(null, <SignedOut onSignIn={() => setDialog('login')} onNewGuest={startAsNewGuest} />)
  }

  if ((playerQuery.isError && !sessionEnded) || content.isError || accountQuery.isError) {
    return shell(
      null,
      <div className="mx-auto max-w-xl px-6 py-20">
          <h1 className="text-3xl font-extrabold">{t('app.errorTitle')}</h1>
          <p className="mt-2 text-muted">{t('app.errorBody')}</p>
          <Button
            className="mt-6"
            onClick={() => {
              void accountQuery.refetch()
              void playerQuery.refetch()
              void content.refetch()
            }}
          >
            {t('app.tryAgain')}
          </Button>
        </div>,
    )
  }

  if (!player || !snapshot || !content.data || !selectedSkillId) {
    return shell(
      null,
      <p className="px-6 py-20 text-center text-lg text-muted" role="status">
        {t('app.loading')}
      </p>,
    )
  }

  const skillOf = (skillId: string) => player.skills[skillId] ?? untouchedSkill
  const totalLevel = skillIds.reduce((sum, skillId) => sum + skillOf(skillId).level, 0)
  const tradeActions = actions.filter((action) => action.skillId === selectedSkillId)

  const showNudge =
    mode === 'guest' && accountState?.enabled === true && !nudgeDismissed && hasProgressWorthSaving(player.skills)

  return shell(
    totalLevel,
    <>
      {/* grid-cols-1 is minmax(0, 1fr): on phones the trade row scrolls instead of widening the page. */}
      {/* The darkened board is the wall behind the screen; the wooden side panels hang in front of it. */}
      <div className="wood-board-back grid flex-1 grid-cols-1 content-start lg:content-normal lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className="wood-board wood-frame wood-panel min-w-0 lg:row-span-2 xl:row-span-1">
          <TradeRail
            selected={villageOpen ? null : selectedSkillId}
            onSelect={(skillId) => {
              setViewedSkillId(skillId)
              setVillageOpen(false)
            }}
            onSelectVillage={() => setVillageOpen(true)}
            trades={skillIds.map((skillId) => ({
              skillId,
              skill: skillOf(skillId),
              working: skillId === activeDefinition?.skillId,
            }))}
          />
        </aside>

        {villageOpen ? (
          // The village fills the middle column; the wooden bar below it holds notices and the worked action.
          <main className="flex min-w-0 flex-col">
            <VillageView />
            <div className="wood-board wood-frame wood-panel">
              <div className="flex w-full max-w-3xl flex-col gap-3">
                {snapshot.replacedLostSave && (
                  <p role="status" className="rounded-md border border-danger/40 bg-white px-4 py-3 text-[15px]">
                    {t('app.lostSave')}
                  </p>
                )}
                {away && <SinceYouLeft summary={away} onDismiss={() => setAway(null)} />}
                {showNudge && <SaveNudge onCreateAccount={() => setDialog('register')} onDismiss={dismissNudge} />}
                {activeAction && (
                  <WorkingAction
                    active={activeAction}
                    action={activeDefinition}
                    receivedAt={snapshot.receivedAt}
                    onCycleComplete={refreshPlayer}
                    onStop={() => stopAction.mutate()}
                    stopping={stopAction.isPending}
                  />
                )}
                {commandError && (
                  <p role="alert" className="text-[15px] font-medium text-danger">
                    {commandErrorText(commandError)}
                  </p>
                )}
              </div>
            </div>
          </main>
        ) : (
          <main className="flex w-full max-w-[880px] min-w-0 flex-col gap-7 justify-self-center px-4 pb-10 sm:px-8 lg:px-10">
            <TradeSign
              skillId={selectedSkillId}
              skill={skillOf(selectedSkillId)}
              working={activeDefinition?.skillId === selectedSkillId ? activeDefinition : undefined}
              swingKey={swingKey}
            />

            {snapshot.replacedLostSave && (
              <p role="status" className="rounded-md border border-danger/40 bg-white px-4 py-3 text-[15px]">
                {t('app.lostSave')}
              </p>
            )}
            {away && <SinceYouLeft summary={away} onDismiss={() => setAway(null)} />}
            {showNudge && <SaveNudge onCreateAccount={() => setDialog('register')} onDismiss={dismissNudge} />}

            <WorkingAction
              active={activeAction}
              action={activeDefinition}
              receivedAt={snapshot.receivedAt}
              onCycleComplete={refreshPlayer}
              onStop={() => stopAction.mutate()}
              stopping={stopAction.isPending}
            />

            {commandError && (
              <p role="alert" className="text-[15px] font-medium text-danger">
                {commandErrorText(commandError)}
              </p>
            )}

            <ActionList
              actions={tradeActions}
              activeActionId={activeAction?.actionId}
              pendingActionId={startAction.isPending ? startAction.variables : undefined}
              onStart={(actionId) => startAction.mutate(actionId)}
            />
          </main>
        )}

        <aside className="wood-board wood-frame wood-panel lg:col-start-2 xl:col-start-auto">
          <Stores inventory={player.inventory} freshItemId={freshItemId} />
        </aside>
      </div>
    </>,
  )
}

interface ShellProps {
  totalLevel: number | null
  /** The account controls, or `null` when the server has no accounts. */
  menu: React.ReactNode
  children: React.ReactNode
}

function Shell({ totalLevel, menu, children }: ShellProps) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center gap-6 bg-oxblood px-4 text-oxblood-ink sm:px-8">
        {/* Grenze's blackletter capital I reads as a J, so the I is set in the sans. */}
        <span className="font-gothic text-[34px] leading-none font-extrabold" role="img" aria-label="IdleHold">
          <span aria-hidden className="mr-px font-sans font-extrabold">I</span>
          <span aria-hidden>dleHold</span>
        </span>
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          {totalLevel !== null && (
            <span className="hidden text-[15px] font-medium text-oxblood-soft sm:inline">
              {t('app.totalLevel')} <span className="font-extrabold text-oxblood-ink">{totalLevel}</span>
            </span>
          )}
          {menu}
          <LanguageSwitch />
        </div>
      </header>
      {children}
    </div>
  )
}
