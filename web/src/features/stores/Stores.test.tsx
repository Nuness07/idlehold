import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Storage } from '../../api/client'
import { SLOTS_PER_PAGE, Stores } from './Stores'

const storage = (slotCount: number, ...slots: [string, number][]): Storage => ({
  slotCount,
  stackSize: 10_000,
  slots: slots.map(([itemId, quantity]) => ({ itemId, quantity })),
})

function grid() {
  return within(screen.getByRole('list', { name: 'Storehouse' }))
}

const stackNames = () => grid().queryAllByRole('button').map((slot) => slot.getAttribute('aria-label'))

describe('Stores', () => {
  it('shows the stacks the server sends, in its order, then the free slots', () => {
    render(<Stores storage={storage(6, ['pine-log', 10_000], ['pine-log', 5_000], ['pebble', 6])} freshItemId={undefined} />)

    expect(stackNames()).toEqual(['Pine log, 10,000', 'Pine log, 5,000', 'Pebble, 6'])
    expect(grid().getAllByLabelText('Empty slot')).toHaveLength(3)
    expect(screen.getByText('Slots: 3 of 6')).toBeInTheDocument()
  })

  it('names the item in a tooltip', async () => {
    render(<Stores storage={storage(4, ['pine-log', 9_870])} freshItemId={undefined} />)

    await userEvent.tab()

    expect(screen.getByRole('tooltip')).toHaveTextContent('Pine log')
    expect(screen.getByText('9,870')).toBeInTheDocument()
  })

  it('splits the slots into pages', async () => {
    const stacks = Array.from({ length: SLOTS_PER_PAGE + 2 }, (_, index): [string, number] => [`item-${index}`, 1])
    render(<Stores storage={storage(48, ...stacks)} freshItemId={undefined} />)

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(stackNames()).toHaveLength(SLOTS_PER_PAGE)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(stackNames()).toEqual(['Item 24, 1', 'Item 25, 1'])
    expect(grid().getAllByLabelText('Empty slot')).toHaveLength(48 - SLOTS_PER_PAGE - 2)
  })

  it('has no pages while every slot fits on one', () => {
    render(<Stores storage={storage(SLOTS_PER_PAGE, ['twig', 3])} freshItemId={undefined} />)

    expect(screen.queryByRole('navigation', { name: 'Storehouse pages' })).not.toBeInTheDocument()
  })

  it('says when every slot is taken', () => {
    render(<Stores storage={storage(2, ['twig', 3], ['pebble', 1])} freshItemId={undefined} />)

    expect(screen.getByText('Full')).toBeInTheDocument()
  })

  it('says the stores are empty and still shows the free slots', () => {
    render(<Stores storage={storage(4)} freshItemId={undefined} />)

    expect(screen.getByText(/Nothing stored yet/)).toBeInTheDocument()
    expect(grid().getAllByLabelText('Empty slot')).toHaveLength(4)
  })
})
