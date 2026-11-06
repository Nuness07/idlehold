import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Skill } from '../../api/client'
import { TradeRail } from './TradeRail'

const skill: Skill = { level: 1, xp: 0, levelStartXp: 0, nextLevelXp: 83 }
const trades = [{ skillId: 'woodcutting', skill, working: false }]

describe('TradeRail', () => {
  it('marks the village as the screen shown when no trade is selected', () => {
    render(<TradeRail trades={trades} selected={null} onSelect={vi.fn()} onSelectVillage={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Village' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Woodcutting/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('goes back to the village from a trade', async () => {
    const onSelectVillage = vi.fn()
    render(<TradeRail trades={trades} selected="woodcutting" onSelect={vi.fn()} onSelectVillage={onSelectVillage} />)

    await userEvent.click(screen.getByRole('button', { name: 'Village' }))

    expect(onSelectVillage).toHaveBeenCalled()
  })
})
