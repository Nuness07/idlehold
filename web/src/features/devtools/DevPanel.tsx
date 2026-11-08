import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Content, Player } from '../../api/client'
import { Button } from '../../components/Button'
import { itemIdsIn } from '../../content/items'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'
import { useDevEdit } from './queries'

interface DevPanelProps {
  player: Player
  content: Content
}

/** Time skips offered as buttons, in minutes. */
const SKIPS = [60, 8 * 60, 24 * 60]

const sectionTitle = 'text-xs font-extrabold tracking-[0.14em] text-muted uppercase'
const field = 'min-h-10 min-w-0 rounded border border-rule bg-limewash px-2 text-[15px]'

/**
 * Development tools (GM mode): set a trade's level, set how many of an item the stores hold (a tool is an
 * item, so this gives and takes tools), skip time and reset the hold. The server applies every edit; the
 * panel only exists in the dev build (`pnpm dev`), and its routes only on a development API.
 */
export default function DevPanel({ player, content }: DevPanelProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const edit = useDevEdit(player.id)
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const tools = new Set(content.tools.map((tool) => tool.itemId))
  const itemIds = itemIdsIn(content)

  const [skillId, setSkillId] = useState(content.skills[0]?.id ?? '')
  const [level, setLevel] = useState('')
  const [itemId, setItemId] = useState(itemIds[0] ?? '')
  const [count, setCount] = useState('')

  const currentLevel = player.skills[skillId]?.level ?? 1
  const currentCount = player.inventory[itemId] ?? 0
  const isTool = tools.has(itemId)

  const submitLevel = (event: FormEvent) => {
    event.preventDefault()
    edit.mutate({ kind: 'level', skillId, level: Number(level || currentLevel) })
    setLevel('')
  }

  const submitCount = (event: FormEvent) => {
    event.preventDefault()
    edit.mutate({ kind: 'items', itemId, count: Number(count || currentCount) })
    setCount('')
  }

  const reset = () => {
    if (window.confirm(t('devTools.resetConfirm'))) edit.mutate({ kind: 'reset' })
  }

  return (
    // Bottom left, above the phone menu bar; the side panels leave this corner free on wide screens.
    <div className="fixed bottom-[76px] left-3 z-50 flex flex-col items-start gap-2 xl:bottom-3">
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={t('devTools.title')}
          className="paper flex max-h-[70dvh] w-[min(340px,calc(100vw-24px))] flex-col gap-4 overflow-y-auto rounded border-2 border-ochre px-4 py-4"
        >
          <p className="text-[13px] leading-snug text-muted">{t('devTools.note')}</p>

          <form onSubmit={submitLevel} className="flex flex-col gap-2">
            <h2 className={sectionTitle}>{t('devTools.level')}</h2>
            <div className="flex gap-2">
              <select
                aria-label={t('devTools.trade')}
                className={cn(field, 'flex-1')}
                value={skillId}
                onChange={(event) => setSkillId(event.target.value)}
              >
                {content.skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {text.tradeName(skill.id)}
                  </option>
                ))}
              </select>
              <input
                aria-label={t('devTools.levelValue')}
                className={cn(field, 'w-16')}
                type="number"
                min={1}
                max={99}
                placeholder={String(currentLevel)}
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              />
              <Button type="submit" disabled={edit.isPending}>
                {t('devTools.set')}
              </Button>
            </div>
          </form>

          <form onSubmit={submitCount} className="flex flex-col gap-2">
            <h2 className={sectionTitle}>{t('devTools.items')}</h2>
            <div className="flex gap-2">
              <select
                aria-label={t('devTools.item')}
                className={cn(field, 'flex-1')}
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
              >
                {itemIds.map((id) => (
                  <option key={id} value={id}>
                    {tools.has(id) ? t('devTools.toolOption', { name: text.itemName(id) }) : text.itemName(id)}
                  </option>
                ))}
              </select>
              <input
                aria-label={t('devTools.count')}
                className={cn(field, 'w-20')}
                type="number"
                min={0}
                max={isTool ? 1 : undefined}
                placeholder={String(currentCount)}
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
              <Button type="submit" disabled={edit.isPending}>
                {t('devTools.set')}
              </Button>
            </div>
            {isTool && <p className="text-[13px] text-muted">{t('devTools.toolHint')}</p>}
          </form>

          <section className="flex flex-col gap-2">
            <h2 className={sectionTitle}>{t('devTools.time')}</h2>
            <div className="flex flex-wrap gap-2">
              {SKIPS.map((minutes) => (
                <Button
                  key={minutes}
                  variant="quiet"
                  disabled={edit.isPending}
                  onClick={() => edit.mutate({ kind: 'advance', minutes })}
                >
                  {t('devTools.skip', { hours: minutes / 60 })}
                </Button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className={sectionTitle}>{t('devTools.hold')}</h2>
            <div>
              <Button variant="quiet" className="border-danger text-danger" disabled={edit.isPending} onClick={reset}>
                {t('devTools.reset')}
              </Button>
            </div>
          </section>

          {edit.error && (
            <p role="alert" className="text-[14px] font-medium text-danger">
              {t('devTools.failed')}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="rounded border-2 border-ink bg-ochre px-3 py-1.5 text-[13px] font-extrabold tracking-[0.14em] text-ink uppercase shadow-[0_2px_0_rgb(0_0_0/0.35)] hover:brightness-110"
      >
        {t('devTools.toggle')}
      </button>
    </div>
  )
}
