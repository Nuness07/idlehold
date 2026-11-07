import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Joins class names, dropping falsy ones, and lets a later Tailwind class win over an earlier one of the
 * same kind (`cn('px-4', 'px-2')` is `px-2`). In plain CSS the order in the attribute does not decide which
 * rule applies, so without the merge a `className` passed to a component would not reliably override it.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
