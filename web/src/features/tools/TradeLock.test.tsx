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

  it('names the village building that opens the trade and leads to the village', async () => {
    const onOpenVillage = vi.fn()
    render(<TradeLock buildingId="campfire" onOpenVillage={onOpenVillage} />)

    expect(screen.getByRole('region', { name: 'Opens in the village' })).toBeInTheDocument()
    expect(screen.getByText('Light the campfire')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Go to the village' }))

    expect(onOpenVillage).toHaveBeenCalled()
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
