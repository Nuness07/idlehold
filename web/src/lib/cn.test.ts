import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('drops falsy values and joins the rest', () => {
    expect(cn('flex', false, undefined, null, '', 'gap-2')).toBe('flex gap-2')
  })

  it('applies conditional objects', () => {
    expect(cn('border', { 'border-ochre': true, 'border-rule': false })).toBe('border border-ochre')
  })

  it('lets a later class win over an earlier one of the same kind', () => {
    expect(cn('px-4 py-2', 'px-2')).toBe('py-2 px-2')
  })

  it('treats theme colors as colors and arbitrary sizes as font sizes', () => {
    expect(cn('text-ink text-[15px]', 'text-muted')).toBe('text-[15px] text-muted')
    expect(cn('bg-ink', 'bg-transparent')).toBe('bg-transparent')
  })
})
