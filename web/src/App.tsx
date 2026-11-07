import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError, type Skill } from './api/client'
import { Button } from './components/Button'
import { LanguageSwitch } from './components/LanguageSwitch'
import { useContentText } from './content/text'
import { AccountDialog } from './features/account/AccountDialog'
import type { AccountFormMode } from './features/account/AccountForm'
import { AccountMenu } from './features/account/AccountMenu'
import { endSession, useAccount, useLogout } from './features/account/queries'
import { hasProgressWorthSaving, useNudgeDismissed } from './features/account/nudge'
import { SaveNudge } from './features/account/SaveNudge'
import { ActionList } from './features/actions/ActionList'
import { WorkingAction } from './features/actions/WorkingAction'
import {
  playerQueryKey,
  isSessionEnded,
  useContent,
  usePlayer,
  useStartAction,
  useStopAction,
} from './features/player/queries'
import { SinceYouLeft } from './features/player/SinceYouLeft'
import { rememberLastSeen, summarizeAway, type AwaySummary } from './features/player/awaySummary'
import { Stores } from './features/stores/Stores'
import { ToolCards } from './features/tools/ToolCards'
import { toolCardsFor, tradeToolFor } from './features/tools/tools'
import { TradeToolNotice } from './features/tools/TradeToolNotice'
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
  const account = accountQuery.data
  const playerQuery = usePlayer(account !== undefined)
  const snapshot = playerQuery.data
  const player = snapshot?.player

  const startAction = useStartAction(player?.id)
  const stopAction = useStopAction(player?.id)
  const commandError = startAction.error ?? stopAction.error

  /** A refusal from the game (409) says why; anything else is a connection or server problem. */
  const commandErrorText = (error: Error) => {
    const reason = isApiError(error, 409) ? error.problem.reason : undefined
    if (reason === 'missing-inputs') return t('app.actionBlocked.missing-inputs')
    if (reason === 'tool-already-owned') return t('app.actionBlocked.tool-already-owned')
    return t('app.actionFailed')
  }
  const logout = useLogout()

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
  const skills = useMemo(() => content.data?.skills ?? [], [content.data])
  const skillIds = useMemo(() => skills.map((skill) => skill.id), [skills])
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
    () => queryClient.invalidateQueries({ queryKey: playerQueryKey }),
    [queryClient],
  )

  // The session ended while playing (expired, or signed out in another tab). The browser starts over
  // as a new guest; someone who had an account is offered the sign-in form to get back to it.
  const sessionEnded =
    isSessionEnded(playerQuery.error) || isSessionEnded(startAction.error) || isSessionEnded(stopAction.error)
  const hadAccount = account?.isGuest === false
  useEffect(() => {
    if (!sessionEnded) return
    void endSession(queryClient).then(() => {
      if (hadAccount) setDialog('login')
    })
  }, [sessionEnded, hadAccount, queryClient])

  const guestHasXp = account?.isGuest === true && player ? Object.values(player.skills).some((skill) => skill.xp > 0) : false
  const shell = (totalLevel: number | null, children: React.ReactNode) => (
    <Shell
      totalLevel={totalLevel}
      menu={
        account ? (
          <AccountMenu
            account={account}
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
        guestHasProgress={guestHasXp}
      />
    </Shell>
  )

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
  // Recipes that make a tool show as tool cards (always the next tier), not as rows of the action list.
  const toolItemIds = new Set(content.data.tools.map((tool) => tool.itemId))
  const tradeActions = actions.filter(
    (action) => action.skillId === selectedSkillId && !toolItemIds.has(action.outputItemId),
  )
  const toolCards = toolCardsFor(selectedSkillId, player.tools, actions)
  const tradeTool = tradeToolFor(selectedSkillId, content.data.tools, player.tools, actions)
  const pendingActionId = startAction.isPending ? startAction.variables : undefined

  const showNudge = account?.isGuest === true && !nudgeDismissed && hasProgressWorthSaving(player.skills)

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
            trades={skills.map(({ id: skillId, category }) => ({
              skillId,
              category,
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

            {tradeTool && <TradeToolNotice tool={tradeTool} onOpenTrade={setViewedSkillId} />}

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

            <ToolCards
              cards={toolCards}
              inventory={player.inventory}
              activeActionId={activeAction?.actionId}
              pendingActionId={pendingActionId}
              onBuild={(actionId: string) => startAction.mutate(actionId)}
            />

            {tradeActions.length > 0 && (
              <ActionList
                actions={tradeActions}
                activeActionId={activeAction?.actionId}
                pendingActionId={pendingActionId}
                onStart={(actionId) => startAction.mutate(actionId)}
              />
            )}
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
  /** The account controls, or `null` until the session is known. */
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
