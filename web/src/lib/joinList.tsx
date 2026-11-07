import { Fragment, type ReactNode } from 'react'

/** Joins elements the way the language does: "a, b and c" / "a, b e c". */
export function joinList(parts: ReactNode[], language: string): ReactNode[] {
  const placeholders = parts.map((_, index) => `\u0000${index}\u0000`)
  return new Intl.ListFormat(language, { type: 'conjunction' })
    .formatToParts(placeholders)
    .map((part, index) =>
      part.type === 'element'
        ? <Fragment key={index}>{parts[placeholders.indexOf(part.value)]}</Fragment>
        : <Fragment key={index}>{part.value}</Fragment>,
    )
}
