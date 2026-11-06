import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VillageView } from './VillageView'

describe('VillageView', () => {
  it('names the screen after the village', () => {
    render(<VillageView />)

    expect(screen.getByRole('heading', { level: 1, name: 'Idle Road' })).toBeInTheDocument()
  })

  it('describes the scene as one image', () => {
    render(<VillageView />)

    expect(screen.getByRole('img', { name: /campfire/ })).toBeInTheDocument()
  })
})
