import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import chainStrip from '../../assets/frames/lock-chain.png'
import padlock from '../../assets/frames/lock-padlock.png'
import { PixelSprite } from '../../components/PixelSprite'
import { WoodButton } from '../../components/WoodButton'
import { buildingSprite, itemSprite, type SpriteArt } from '../../content/labels'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'

function spriteOf(itemId: string): SpriteArt | undefined {
  const src = itemSprite(itemId)
  return src ? { src, width: 32, height: 32 } : undefined
}

/** Art pixels are drawn at this scale, like the rest of the board. */
const SCALE = 3

interface LockedAreaProps {
  locked: boolean
  children: ReactNode
}

/** Part of a locked trade's screen: dimmed and out of reach (`inert`: it cannot be clicked or focused). */
export function LockedArea({ locked, children }: LockedAreaProps) {
  return (
    <div inert={locked} className={cn(locked && 'opacity-25 grayscale-[0.8] blur-[1px] select-none')}>
      {children}
    </div>
  )
}

interface TradeLockProps {
  /** The village building that opens the trade, as the server says; it comes before a tool. */
  buildingId?: string
  onOpenVillage?: () => void
  /** The tool that opens the trade, as the server says. */
  toolItemId?: string
  /** The trade whose recipe makes that tool, if any. */
  makerSkillId?: string
  onOpenTrade?: (skillId: string) => void
}

/**
 * Laid over a locked trade's column: two iron chains crossed from corner to corner, a padlock where they
 * cross, and a plaque on it naming what opens the trade (a village building to build or a tool to make) with a
 * button to where it is made. The parent must be `relative`.
 */
export function TradeLock({ buildingId, onOpenVillage, toolItemId, makerSkillId, onOpenTrade }: TradeLockProps) {
  const { t } = useTranslation()
  const text = useContentText()
  const opener = buildingId
    ? {
        label: t('village.build.lockLabel'),
        name: text.buildingAction(buildingId),
        art: buildingSprite(buildingId),
        go: onOpenVillage && { text: t('village.build.goVillage'), onClick: onOpenVillage },
      }
    : {
        label: t('tools.lockedUntil'),
        name: toolItemId ? text.itemName(toolItemId) : '',
        art: toolItemId ? spriteOf(toolItemId) : undefined,
        go: makerSkillId &&
          onOpenTrade && { text: t('tools.goMake', { trade: text.tradeName(makerSkillId) }), onClick: () => onOpenTrade(makerSkillId) },
      }

  return (
    <div role="region" aria-label={opener.label} className="pointer-events-none absolute inset-0 overflow-hidden">
      <ChainsX />
      {/* The padlock sits exactly where the chains cross; the plaque and the button hang below it. */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <PixelSprite src={padlock} width={22} height={30} scale={SCALE} className="drop-shadow-[0_6px_0_rgb(0_0_0/0.45)]" />
          <div className="absolute top-full left-1/2 -mt-3 flex w-max -translate-x-1/2 flex-col items-center">
            <p className="lock-plaque flex flex-col items-center gap-1 drop-shadow-[0_4px_0_rgb(0_0_0/0.45)]">
              <span className="text-xs font-extrabold tracking-[0.14em] uppercase opacity-75">{opener.label}</span>
              <span className="flex items-center gap-2 text-lg leading-tight font-extrabold">
                {opener.art && <PixelSprite src={opener.art.src} width={opener.art.width} height={opener.art.height} />}
                {opener.name}
              </span>
            </p>
            {opener.go && (
              <WoodButton className="pointer-events-auto mt-4 px-2" onClick={opener.go.onClick}>
                {opener.go.text}
              </WoodButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The two chains, drawn on a canvas in art pixels and shown at 3x, so they reach exactly from corner to corner
 * at whatever angle the column's size gives. The strip is turned with nearest-neighbour sampling: every art
 * pixel stays one 3x3 block on the grid, never smeared.
 */
function ChainsX() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const box = canvas?.parentElement
    if (!canvas || !box) return

    const strip = new Image()
    strip.src = chainStrip
    // The column is measured on every draw: now, once the strip loads, and on every resize.
    const draw = () => {
      const width = Math.ceil(box.clientWidth / SCALE)
      const height = Math.ceil(box.clientHeight / SCALE)
      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width * SCALE}px`
      canvas.style.height = `${height * SCALE}px`
      const context = canvas.getContext('2d')
      if (!context || !strip.complete || strip.naturalWidth === 0 || width === 0 || height === 0) return

      context.imageSmoothingEnabled = false
      const diagonals: [number, number, number, number][] = [
        [0, 0, width, height],
        [width, 0, 0, height],
      ]
      for (const [x0, y0, x1, y1] of diagonals) {
        const length = Math.hypot(x1 - x0, y1 - y0)
        context.save()
        context.translate(x0, y0)
        context.rotate(Math.atan2(y1 - y0, x1 - x0))
        // Start and end a link past each corner, so the chain leaves the column instead of stopping short.
        for (let x = -strip.naturalWidth; x < length + strip.naturalWidth; x += strip.naturalWidth) {
          context.drawImage(strip, x, -Math.floor(strip.naturalHeight / 2))
        }
        context.restore()
      }
    }

    const observer = new ResizeObserver(draw)
    strip.onload = draw
    observer.observe(box)
    draw()
    return () => {
      strip.onload = null
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute top-0 left-0 [image-rendering:pixelated] drop-shadow-[0_6px_0_rgb(0_0_0/0.45)]"
    />
  )
}
