import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Stores } from './Stores'

const itemOrder = ['twig', 'pine-log', 'pebble', 'chipped-stone-axe']

function slotNames() {
  return within(screen.getByRole('list', { name: 'Storehouse' }))
    .getAllByRole('button')
    .map((slot) => slot.getAttribute('aria-label'))
}

describe('Stores', () => {
  it('shows one slot per item, in the game order, whatever the counts', () => {
    render(<Stores inventory={{ pebble: 900, twig: 3, 'pine-log': 40 }} itemOrder={itemOrder} freshItemId={undefined} />)

    expect(slotNames()).toEqual(['Twig, 3', 'Pine log, 40', 'Pebble, 900'])
  })

  it('puts an item the content does not list after the known ones', () => {
    render(<Stores inventory={{ 'old-relic': 1, twig: 3 }} itemOrder={itemOrder} freshItemId={undefined} />)

    expect(slotNames()).toEqual(['Twig, 3', 'Old relic, 1'])
  })

  it('names the item in a tooltip', async () => {
    render(<Stores inventory={{ 'pine-log': 9870 }} itemOrder={itemOrder} freshItemId={undefined} />)

    await userEvent.tab()

    expect(screen.getByRole('tooltip')).toHaveTextContent('Pine log')
    expect(screen.getByText('9,870')).toBeInTheDocument()
  })

  it('says the stores are empty when nothing is stored', () => {
    render(<Stores inventory={{ twig: 0 }} itemOrder={itemOrder} freshItemId={undefined} />)

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText(/Nothing stored yet/)).toBeInTheDocument()
  })
})
