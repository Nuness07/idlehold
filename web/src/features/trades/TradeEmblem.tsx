import woodFrame from '../../assets/frames/wood.png'
import { PixelSprite } from '../../components/PixelSprite'
import type { TradeLabel } from '../../content/labels'

interface TradeEmblemProps {
  trade: TradeLabel
  /** Whole-number zoom of the framed emblem. */
  scale: 1 | 2
  /** Icon size class used when the trade has no pixel-art emblem yet. */
  fallbackClassName: string
}

/**
 * The frame the emblem hangs in, in art pixels. Wood is the first tier; later tiers
 * (stone, gold, ...) share this shape so they can swap in without layout changes.
 */
const FRAME = { src: woodFrame, width: 46, height: 48, openingX: 7, openingY: 8, openingSize: 32 }

/** A trade's pixel-art emblem set in its frame, or its line icon until one is drawn. Always decorative. */
export function TradeEmblem({ trade, scale, fallbackClassName }: TradeEmblemProps) {
  if (!trade.emblem) {
    return <trade.Icon aria-hidden className={fallbackClassName} strokeWidth={1.75} />
  }

  const opening = {
    left: FRAME.openingX * scale,
    top: FRAME.openingY * scale,
    width: FRAME.openingSize * scale,
    height: FRAME.openingSize * scale,
  }

  return (
    <span
      aria-hidden
      className="relative block shrink-0"
      style={{ width: FRAME.width * scale, height: FRAME.height * scale }}
    >
      <span className="absolute bg-frame-well" style={opening} />
      <span className="absolute" style={opening}>
        <PixelSprite src={trade.emblem} width={32} height={32} scale={scale} />
      </span>
      <PixelSprite src={FRAME.src} width={FRAME.width} height={FRAME.height} scale={scale} className="absolute inset-0" />
    </span>
  )
}
