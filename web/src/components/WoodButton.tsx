import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/**
 * A pixel-art wooden plank button for actions in the world, such as building a tool.
 * The plank is a 9-slice image (`.wood-button`); the label stays HTML, so it stays crisp and translatable.
 */
export function WoodButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'wood-button inline-flex items-center justify-center text-[15px] leading-none font-extrabold',
        className,
      )}
      {...props}
    />
  )
}
