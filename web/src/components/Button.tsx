import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Variant = 'primary' | 'quiet'

const styles: Record<Variant, string> = {
  primary:
    'bg-ink text-limewash hover:bg-ink-hover active:bg-black disabled:bg-rule disabled:text-muted',
  quiet:
    'border border-ink/70 bg-transparent text-ink hover:bg-ink/5 active:bg-ink/10 disabled:border-rule disabled:text-muted',
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded px-4 text-[15px] font-bold transition-colors duration-150',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
