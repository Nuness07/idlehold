import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CampfirePopup } from './CampfirePopup'

const cost = [
  { itemId: 'twig', quantity: 10 },
  { itemId: 'reed', quantity: 5 },
  { itemId: 'pebble', quantity: 8 },
]

describe('CampfirePopup', () => {
  it('shows the goal, what it opens and what it takes against the stores', () => {
    render(<CampfirePopup cost={cost} opensSkillId="cooking" inventory={{ twig: 12, reed: 2 }} lighting={false} onLight={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Light the campfire' })).toBeInTheDocument()
    expect(screen.getByText('Opens Cooking')).toBeInTheDocument()
    const materials = screen.getByRole('list', { name: 'Materials' })
    expect(within(materials).getByText('12 of 10 twigs')).toBeInTheDocument()
    expect(within(materials).getByText('2 of 5 reeds')).toBeInTheDocument()
  })

  it('cannot be lit while something is missing', () => {
    render(<CampfirePopup cost={cost} opensSkillId="cooking" inventory={{ twig: 10, reed: 5 }} lighting={false} onLight={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Light it' })).toBeDisabled()
  })

  it('lights the campfire once the stores hold everything', async () => {
    const onLight = vi.fn()
    render(<CampfirePopup cost={cost} opensSkillId="cooking" inventory={{ twig: 10, reed: 5, pebble: 8 }} lighting={false} onLight={onLight} />)

    await userEvent.click(screen.getByRole('button', { name: 'Light it' }))

    expect(onLight).toHaveBeenCalled()
  })
})
