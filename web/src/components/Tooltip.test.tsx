import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tooltip, TooltipTitle } from './Tooltip'

function renderTooltip() {
  render(
    <Tooltip content={<TooltipTitle>Pine log</TooltipTitle>}>
      <button type="button">slot</button>
    </Tooltip>,
  )
  return screen.getByRole('button', { name: 'slot' })
}

describe('Tooltip', () => {
  it('stays hidden until the trigger is reached', () => {
    renderTooltip()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('opens on hover and describes the trigger', async () => {
    const trigger = renderTooltip()

    await userEvent.hover(trigger)

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Pine log')
    expect(trigger).toHaveAccessibleDescription('Pine log')
  })

  it('opens on keyboard focus and closes on Escape', async () => {
    renderTooltip()

    await userEvent.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('opens on a tap, where there is no hover', async () => {
    const trigger = renderTooltip()
    const touch = userEvent.setup()

    await touch.pointer({ keys: '[TouchA]', target: trigger })

    expect(await screen.findByRole('tooltip')).toBeInTheDocument()
  })
})
