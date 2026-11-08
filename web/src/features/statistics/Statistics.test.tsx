import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Skill } from '../../api/client'
import { Statistics } from './Statistics'

const untouched: Skill = { xp: 0, level: 1, levelStartXp: 0, nextLevelXp: 83 }
const worked: Skill = { xp: 1200, level: 10, levelStartXp: 1154, nextLevelXp: 1358 }

describe('Statistics', () => {
  it('totals what the server sent', () => {
    render(<Statistics skills={[worked, untouched, untouched]} inventory={{ 'pine-log': 1500, twig: 40 }} />)

    const value = (label: string) => screen.getByText(label).nextElementSibling?.textContent
    expect(value('Total level')).toBe('12')
    expect(value('Total experience')).toBe('1,200')
    expect(value('Items in the storehouse')).toBe('1,540')
    expect(value('Trades started')).toBe('1 of 3')
  })
})
