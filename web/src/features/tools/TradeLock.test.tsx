import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TradeLock } from './TradeLock'

describe('TradeLock', () => {
  it('names the tool that opens the trade', () => {
    render(
      <TradeLock toolItemId="chipped-stone-axe" makerSkillId="crafting" onOpenTrade={vi.fn()}>
        <p>actions</p>
      </TradeLock>,
    )

    expect(screen.getByRole('region', { name: 'Locked until you have' })).toBeInTheDocument()
    expect(screen.getByText('Chipped stone axe')).toBeInTheDocument()
  })

  it('keeps the trade out of reach', () => {
    render(
      <TradeLock toolItemId="chipped-stone-axe" makerSkillId="crafting" onOpenTrade={vi.fn()}>
        <button type="button">Cut pine</button>
      </TradeLock>,
    )

    // The browser makes inert content unclickable and unfocusable; jsdom only keeps the attribute.
    expect(screen.getByText('Cut pine').closest('[inert]')).not.toBeNull()
  })

  it('opens the trade that makes the tool', async () => {
    const onOpenTrade = vi.fn()
    render(
      <TradeLock toolItemId="chipped-stone-axe" makerSkillId="crafting" onOpenTrade={onOpenTrade}>
        <p>actions</p>
      </TradeLock>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Make it in Crafting' }))

    expect(onOpenTrade).toHaveBeenCalledWith('crafting')
  })
})
