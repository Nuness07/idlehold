import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { joinList } from './joinList'

const joined = (parts: string[], language: string) =>
  render(<p>{joinList(parts.map((part) => <strong key={part}>{part}</strong>), language)}</p>).container.textContent

describe('joinList', () => {
  it('joins elements the way each language does', () => {
    expect(joined(['logs', 'stone', 'fish'], 'en')).toBe('logs, stone, and fish')
    expect(joined(['toras', 'pedra', 'peixe'], 'pt-BR')).toBe('toras, pedra e peixe')
  })

  it('keeps each element as it was given', () => {
    const { container } = render(<p>{joinList([<strong key="a">a</strong>, <em key="b">b</em>], 'en')}</p>)

    expect(container.querySelector('strong')?.textContent).toBe('a')
    expect(container.querySelector('em')?.textContent).toBe('b')
  })
})
