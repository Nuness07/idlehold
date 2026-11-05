import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Skill } from './api/client'
import { Button } from './components/Button'
import { actionLabel, itemLabel } from './content/labels'
import { ActionList } from './features/actions/ActionList'
import { WorkingAction } from './features/actions/WorkingAction'
import { playerQueryKey, useContent, usePlayer, useStartAction, useStopAction } from './features/player/queries'
import { SinceYouLeft } from './features/player/SinceYouLeft'
import { rememberLastSeen, summarizeAway, type AwaySummary } from './features/player/awaySummary'
import { Stores } from './features/stores/Stores'
import { TradeRail } from './features/trades/TradeRail'
import { TradeSign } from './features/trades/TradeSign'
import { formatCount } from './lib/format'

/** A trade the player has not earned XP in yet. Its real level bounds arrive with the first XP. */
const untouchedSkill: Skill = { xp: 0, level: 1, levelStartXp: 0, nextLevelXp: null }

export default function App() {
  const queryClient = useQueryClient()
  const content = useContent()
  const playerQuery = usePlayer()
  const snapshot = playerQuery.data
  const player = snapshot?.player

  const startAction = useStartAction(player?.id)
  const stopAction = useStopAction(player?.id)

  const [away, setAway] = useState<AwaySummary | null>(null)
  const [swingKey, setSwingKey] = useState(0)
  const [freshItemId, setFreshItemId] = useState<string>()
  const summarized = useRef(false)
  const lastTotals = useRef<{ xp: number; levels: number } | null>(null)

  const actions = useMemo(() => content.data?.actions ?? [], [content.data])
  const skillIds = useMemo(() => [...new Set(actions.map((action) => action.skillId))], [actions])
  const activeAction = player?.activeAction ?? null
  const activeDefinition = actions.find((action) => action.id === activeAction?.actionId)
  const selectedSkillId = activeDefinition?.skillId ?? skillIds[0]

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
      xp: skills.reduce((sum, skill) => sum + skill.xp, 0),
      levels: skills.reduce((sum, skill) => sum + skill.level, 0),
    }
    const previous = lastTotals.current
    lastTotals.current = totals
    if (previous === null || totals.xp <= previous.xp) return

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
    document.title = `${formatCount(count)} ${itemLabel(activeDefinition.outputItemId).toLowerCase()}s · ${actionLabel(activeDefinition.id).verb} · IdleHold`
  }, [player, activeDefinition])

  const refreshPlayer = useCallback(
    () => queryClient.invalidateQueries({ queryKey: playerQueryKey }),
    [queryClient],
  )

  if (playerQuery.isError || content.isError) {
    return (
      <Shell totalLevel={null}>
        <div className="mx-auto max-w-xl px-6 py-20">
          <h1 className="text-3xl font-extrabold">The hold can't be reached</h1>
          <p className="mt-2 text-muted">
            The game server did not answer. Your progress is safe on the server; try again in a moment.
          </p>
          <Button className="mt-6" onClick={() => { void playerQuery.refetch(); void content.refetch() }}>
            Try again
          </Button>
        </div>
      </Shell>
    )
  }

  if (!player || !snapshot || !content.data || !selectedSkillId) {
    return (
      <Shell totalLevel={null}>
        <p className="px-6 py-20 text-center text-lg text-muted" role="status">
          Opening the hold…
        </p>
      </Shell>
    )
  }

  const skillOf = (skillId: string) => player.skills[skillId] ?? untouchedSkill
  const totalLevel = skillIds.reduce((sum, skillId) => sum + skillOf(skillId).level, 0)
  const tradeActions = actions.filter((action) => action.skillId === selectedSkillId)

  return (
    <Shell totalLevel={totalLevel}>
      <div className="grid flex-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="border-b border-rule bg-limewash lg:row-span-2 lg:border-r lg:border-b-0 xl:row-span-1">
          <TradeRail
            selected={selectedSkillId}
            trades={skillIds.map((skillId) => ({
              skillId,
              skill: skillOf(skillId),
              working: skillId === activeDefinition?.skillId,
            }))}
          />
        </aside>

        <main className="flex w-full max-w-[880px] min-w-0 flex-col gap-7 justify-self-center px-4 pb-10 sm:px-8 lg:px-10">
          <TradeSign
            skillId={selectedSkillId}
            skill={skillOf(selectedSkillId)}
            working={activeDefinition?.skillId === selectedSkillId ? activeDefinition : undefined}
            swingKey={swingKey}
          />

          {snapshot.replacedLostSave && (
            <p role="status" className="rounded-md border border-danger/40 bg-white px-4 py-3 text-[15px]">
              Your previous hold was lost when the server restarted, so a new one was started. Saves will be kept once accounts arrive.
            </p>
          )}

          {away && <SinceYouLeft summary={away} onDismiss={() => setAway(null)} />}

          <WorkingAction
            active={activeAction}
            action={activeDefinition}
            receivedAt={snapshot.receivedAt}
            onCycleComplete={refreshPlayer}
            onStop={() => stopAction.mutate()}
            stopping={stopAction.isPending}
          />

          {(startAction.isError || stopAction.isError) && (
            <p role="alert" className="text-[15px] font-medium text-danger">
              The server did not accept that. Check your connection and try again.
            </p>
          )}

          <ActionList
            actions={tradeActions}
            activeActionId={activeAction?.actionId}
            pendingActionId={startAction.isPending ? startAction.variables : undefined}
            onStart={(actionId) => startAction.mutate(actionId)}
          />
        </main>

        <aside className="border-t border-rule bg-limewash lg:col-start-2 xl:col-start-auto xl:border-t-0 xl:border-l">
          <Stores inventory={player.inventory} freshItemId={freshItemId} />
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ totalLevel, children }: { totalLevel: number | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center gap-6 bg-oxblood px-4 text-oxblood-ink sm:px-8">
        {/* Grenze's blackletter capital I reads as a J, so the I is set in the sans. */}
        <span className="font-gothic text-[34px] leading-none font-extrabold" role="img" aria-label="IdleHold">
          <span aria-hidden className="mr-px font-sans font-extrabold">I</span>
          <span aria-hidden>dleHold</span>
        </span>
        {totalLevel !== null && (
          <span className="ml-auto text-[15px] font-medium text-oxblood-soft">
            Total level <span className="font-extrabold text-oxblood-ink">{totalLevel}</span>
          </span>
        )}
      </header>
      {children}
    </div>
  )
}
