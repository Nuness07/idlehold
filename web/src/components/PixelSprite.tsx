import { cn } from '../lib/cn'

interface PixelSpriteProps {
  src: string
  /** Native size of the sprite in art pixels. */
  width: number
  height: number
  /** Whole-number zoom: pixel art only scales by whole steps, or its pixels smear. */
  scale?: 1 | 2 | 3
  className?: string
}

/** A decorative pixel-art image drawn at a whole-number scale with crisp pixels. */
export function PixelSprite({ src, width, height, scale = 1, className }: PixelSpriteProps) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={width * scale}
      height={height * scale}
      draggable={false}
      className={cn('shrink-0 [image-rendering:pixelated]', className)}
    />
  )
}
