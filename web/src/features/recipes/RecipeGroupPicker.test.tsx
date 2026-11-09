import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecipeGroupPicker } from './RecipeGroupPicker'

const groups = [
  { id: 'campfire', open: true },
  { id: 'stone-furnace', open: false },
]

describe('RecipeGroupPicker', () => {
  it("names what the trade's groups are and marks the shown one", () => {
    render(<RecipeGroupPicker skillId="cooking" groups={groups} selected="campfire" onSelect={vi.fn()} />)

    expect(screen.getByRole('group', { name: 'Station' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Campfire' })).toBeChecked()
  })

  it('shows a group without recipes as coming later, and it cannot be picked', async () => {
    const onSelect = vi.fn()
    render(<RecipeGroupPicker skillId="cooking" groups={groups} selected="campfire" onSelect={onSelect} />)

    const furnace = screen.getByRole('radio', { name: /Stone furnace/ })
    expect(furnace).toBeDisabled()
    expect(screen.getByText('Coming later')).toBeInTheDocument()
    await userEvent.click(furnace)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('picks another group', async () => {
    const onSelect = vi.fn()
    const open = [
      { id: 'chipped-stone', open: true },
      { id: 'stone', open: true },
    ]
    render(<RecipeGroupPicker skillId="crafting" groups={open} selected="chipped-stone" onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Stone' }))

    expect(onSelect).toHaveBeenCalledWith('stone')
  })

  it('draws nothing for a trade without groups', () => {
    const { container } = render(<RecipeGroupPicker skillId="mining" groups={[]} selected={undefined} onSelect={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
