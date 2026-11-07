import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('lets a passed className override its base classes', () => {
    render(<Button className="px-2">Go</Button>)

    const classes = screen.getByRole('button', { name: 'Go' }).className.split(' ')
    expect(classes).toContain('px-2')
    expect(classes).not.toContain('px-4')
  })
})
