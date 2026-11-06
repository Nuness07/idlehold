import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
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
 * The village seen from the camp, looking out to the horizon. Three layers: a sky that drifts slowly in a
 * seamless loop, the painted scene with its sky cut out, and the campfire's flicker on top. Motion stops
 * for players who ask for reduced motion.
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
      <div className="absolute inset-0 [--px:calc(100cqw/320)] [&>*]:[image-rendering:pixelated]">
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
        {/* Campfire: an 8-frame strip holding only the pixels that change, over the fire painted in the scene. */}
        <div
          aria-hidden
          className="absolute motion-safe:animate-village-fire motion-reduce:hidden"
          style={{
            ...art(128, 40, 64, 96),
            backgroundImage: `url(${fire})`,
            backgroundSize: 'calc(512 * var(--px)) 100%',
          }}
        />
      </div>
    </div>
  )
}
