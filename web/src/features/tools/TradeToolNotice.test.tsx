import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TradeToolNotice } from './TradeToolNotice'

describe('TradeToolNotice', () => {
  it('names the tool in use', () => {
    render(<TradeToolNotice tool={{ kind: 'owned', itemId: 'chipped-stone-axe' }} onOpenTrade={vi.fn()} />)

    expect(screen.getByText('Tool in use')).toBeInTheDocument()
    expect(screen.getByText('Chipped stone axe')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('says there is none yet and opens the trade that makes it', async () => {
    const onOpenTrade = vi.fn()
    render(<TradeToolNotice tool={{ kind: 'missing', recipeSkillId: 'crafting' }} onOpenTrade={onOpenTrade} />)

    expect(screen.getByText('No tool for this trade yet.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Make one in Crafting' }))
    expect(onOpenTrade).toHaveBeenCalledWith('crafting')
  })
})
