import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia } from '../../test/matchMedia'
import { VillageScene } from './VillageScene'

/** jsdom lays nothing out, so give the box the sizes a portrait phone would. */
function phoneSized(box: HTMLElement) {
  Object.defineProperty(box, 'scrollWidth', { configurable: true, value: 700 })
  Object.defineProperty(box, 'clientWidth', { configurable: true, value: 375 })
}

function sceneBox() {
  return screen.getByRole('img', { name: /campfire/ }).parentElement!
}

describe('VillageScene', () => {
  it('clears the phone scroll offset when the screen widens past the breakpoint', () => {
    const resize = stubMatchMedia(false)
    render(<VillageScene />)
    const box = sceneBox()
    box.scrollLeft = 160

    act(() => resize(true))

    expect(box.scrollLeft).toBe(0)
  })

  it('centres the scene again when the screen narrows to a phone', () => {
    const resize = stubMatchMedia(true)
    render(<VillageScene />)
    const box = sceneBox()
    phoneSized(box)

    act(() => resize(false))

    expect(box.scrollLeft).toBe((700 - 375) / 2)
  })
})
