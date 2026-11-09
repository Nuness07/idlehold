import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Fuel } from '../../api/client'
import { FirePanel } from './FirePanel'

const fuels: Fuel[] = [
  { itemId: 'hazel-log', cycles: 2 },
  { itemId: 'pine-log', cycles: 4 },
]

describe('FirePanel', () => {
  it('shows what is left in the fire and each fuel with its stock', () => {
    render(
      <FirePanel fuels={fuels} inventory={{ 'hazel-log': 7 }} fireCyclesLeft={1} selected="hazel-log" burning={false} onSelect={vi.fn()} />,
    )

    expect(screen.getByText('Burns for 1 more dish')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Hazel log/ })).toBeChecked()
    expect(screen.getByText('7 stored · 2 dishes each')).toBeInTheDocument()
    expect(screen.getByText('0 stored · 4 dishes each')).toBeInTheDocument()
  })

  it('picks another fuel', async () => {
    const onSelect = vi.fn()
    render(<FirePanel fuels={fuels} inventory={{}} fireCyclesLeft={0} selected="hazel-log" burning={false} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('radio', { name: /Pine log/ }))

    expect(onSelect).toHaveBeenCalledWith('pine-log')
  })

  it('says the fire is out when nothing burns', () => {
    render(<FirePanel fuels={fuels} inventory={{}} fireCyclesLeft={0} selected="hazel-log" burning={false} onSelect={vi.fn()} />)

    expect(screen.getByText('Out. Pick a fuel and start cooking.')).toBeInTheDocument()
  })
})
