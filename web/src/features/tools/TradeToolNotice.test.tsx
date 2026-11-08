import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TradeToolNotice } from './TradeToolNotice'

describe('TradeToolNotice', () => {
  it('names the tool in use', () => {
    render(<TradeToolNotice itemId="chipped-stone-axe" />)

    expect(screen.getByText('Tool in use')).toBeInTheDocument()
    expect(screen.getByText('Chipped stone axe')).toBeInTheDocument()
  })
})
