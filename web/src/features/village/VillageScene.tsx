import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import campfire from '../../assets/village/campfire.png'
import fire from '../../assets/village/fire.png'
import scene from '../../assets/village/scene.png'
import sky from '../../assets/village/sky.png'

/** Art size of the scene, in pixels. Every layer is placed in these units. */
const ART = { width: 320, height: 180 }

/**
 * Places a layer in art pixels. `--px` is the size of one art pixel on screen, so the layers line up at
 * any size.
 */
function art(left: number, top: number, width: number, height: number): CSSProperties {
  return {
    left: `calc(${left} * var(--px))`,
    top: `calc(${top} * var(--px))`,
    width: `calc(${width} * var(--px))`,
    height: `calc(${height} * var(--px))`,
  }
}

/**
 * The shape of the campfire inside its 41x32 box, so only the fire itself (not the dirt around it) reacts to
 * the pointer. Points are percentages of the box.
 */
const CAMPFIRE_SHAPE = `polygon(${[
  [17, 0], [24, 0], [30, 6], [31, 14], [40, 20], [40, 24], [33, 28], [22, 32],
  [18, 32], [7, 28], [0, 24], [0, 20], [9, 14], [9, 6],
]
  .map(([x, y]) => `${(x / 41) * 100}% ${(y / 32) * 100}%`)
  .join(', ')})`

/**
 * The village seen from the camp, looking out to the horizon. Three layers: a sky that drifts slowly in a
 * seamless loop, the painted scene with its sky cut out, and the campfire on top. The campfire is its own
 * piece (a cutout of the painted fire plus its flicker), so it can brighten under the pointer without
 * touching the rest of the scene. Motion stops for players who ask for reduced motion.
 *
 * The scene spans the width of its column at 16:9; `--px` is that width over 320.
 */
export function VillageScene() {
  const { t } = useTranslation()

  return (
    <div
      role="img"
      aria-label={t('village.sceneLabel')}
      className="relative aspect-[16/9] w-full overflow-hidden [container-type:inline-size]"
    >
      <div className="absolute inset-0 [--px:calc(100cqw/320)] [&_*]:[image-rendering:pixelated]">
        {/* Sky: one art pixel per step, so the clouds stay on the pixel grid. */}
        <div
          aria-hidden
          className="absolute bg-repeat-x motion-safe:animate-village-sky"
          style={{
            ...art(0, 0, ART.width, 64),
            backgroundImage: `url(${sky})`,
            backgroundSize: 'calc(384 * var(--px)) 100%',
          }}
        />
        <img src={scene} alt="" draggable={false} className="absolute inset-0 size-full" />
        {/* Campfire: the painted fire cut out of the scene, then an 8-frame strip holding only the pixels that
            change. Both brighten together while the pointer is over the fire. */}
        <div className="pointer-events-none absolute inset-0 transition-[filter] duration-150 hover:brightness-125">
          <img src={campfire} alt="" draggable={false} className="absolute" style={art(141, 108, 41, 32)} />
          <div
            aria-hidden
            className="absolute motion-safe:animate-village-fire motion-reduce:hidden"
            style={{
              ...art(128, 40, 64, 96),
              backgroundImage: `url(${fire})`,
              backgroundSize: 'calc(512 * var(--px)) 100%',
            }}
          />
          <span
            aria-hidden
            data-testid="campfire-hotspot"
            className="pointer-events-auto absolute"
            style={{ ...art(141, 108, 41, 32), clipPath: CAMPFIRE_SHAPE }}
          />
        </div>
      </div>
    </div>
  )
}
