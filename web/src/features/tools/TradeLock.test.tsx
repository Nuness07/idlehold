import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LockedArea, TradeLock } from './TradeLock'

describe('TradeLock', () => {
  it('names the tool that opens the trade', () => {
    render(<TradeLock toolItemId="chipped-stone-axe" makerSkillId="crafting" onOpenTrade={vi.fn()} />)

    expect(screen.getByRole('region', { name: 'Locked until you have' })).toBeInTheDocument()
    expect(screen.getByText('Chipped stone axe')).toBeInTheDocument()
  })

  it('opens the trade that makes the tool', async () => {
    const onOpenTrade = vi.fn()
    render(<TradeLock toolItemId="chipped-stone-axe" makerSkillId="crafting" onOpenTrade={onOpenTrade} />)

    await userEvent.click(screen.getByRole('button', { name: 'Make it in Crafting' }))

    expect(onOpenTrade).toHaveBeenCalledWith('crafting')
  })
})

describe('LockedArea', () => {
  it('keeps a locked trade out of reach', () => {
    render(
      <LockedArea locked>
        <button type="button">Cut pine</button>
      </LockedArea>,
    )

    // The browser makes inert content unclickable and unfocusable; jsdom only keeps the attribute.
    expect(screen.getByText('Cut pine').closest('[inert]')).not.toBeNull()
  })

  it('leaves an open trade alone', () => {
    render(
      <LockedArea locked={false}>
        <button type="button">Cut pine</button>
      </LockedArea>,
    )

    expect(screen.getByText('Cut pine').closest('[inert]')).toBeNull()
  })
})
