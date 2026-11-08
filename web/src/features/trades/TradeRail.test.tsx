import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Skill } from '../../api/client'
import { TradeRail } from './TradeRail'

const skill: Skill = { level: 1, xp: 0, levelStartXp: 0, nextLevelXp: 83 }
const trades = [
  { skillId: 'woodcutting', category: 'gathering' as const, skill, working: false },
  { skillId: 'crafting', category: 'production' as const, skill, working: false },
]

describe('TradeRail', () => {
  it('marks the village as the screen shown when no trade is selected', () => {
    render(<TradeRail trades={trades} selected={null} villageSelected onSelect={vi.fn()} onSelectVillage={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Village' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Woodcutting/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks nothing while a menu screen is shown', () => {
    render(<TradeRail trades={trades} selected={null} villageSelected={false} onSelect={vi.fn()} onSelectVillage={vi.fn()} />)

    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
  })

  it('goes back to the village from a trade', async () => {
    const onSelectVillage = vi.fn()
    render(<TradeRail trades={trades} selected="woodcutting" villageSelected={false} onSelect={vi.fn()} onSelectVillage={onSelectVillage} />)

    await userEvent.click(screen.getByRole('button', { name: 'Village' }))

    expect(onSelectVillage).toHaveBeenCalled()
  })

  it('lists each trade under its group', () => {
    render(<TradeRail trades={trades} selected={null} villageSelected onSelect={vi.fn()} onSelectVillage={vi.fn()} />)

    const gathering = screen.getByRole('region', { name: 'Gathering' })
    const production = screen.getByRole('region', { name: 'Production' })
    expect(within(gathering).getByRole('button', { name: /Woodcutting/ })).toBeInTheDocument()
    expect(within(production).getByRole('button', { name: /Crafting/ })).toBeInTheDocument()
    expect(within(gathering).queryByRole('button', { name: /Crafting/ })).not.toBeInTheDocument()
  })
})
