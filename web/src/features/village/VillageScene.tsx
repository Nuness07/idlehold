import { useEffect, useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import campfireOut from '../../assets/village/campfire-out.png'
import campfire from '../../assets/village/campfire.png'
import fire from '../../assets/village/fire.png'
import scene from '../../assets/village/scene.png'
import sky from '../../assets/village/sky.png'
import smoke from '../../assets/village/smoke.png'
import { CampfirePopup, type CampfireGoal } from './CampfirePopup'

/** Art size of the scene, in pixels. Every layer is placed in these units. */
const ART = { width: 320, height: 180 }

/** Tailwind's `lg` breakpoint: from here the village crops instead of panning. */
const WIDE_SCREEN = '(min-width: 64rem)'

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
 * The scene covers its box like a cover image: `--px` is the larger of width/320 and height/180, so it
 * fills the box with no empty edge, centred. On wide screens the overflow is cropped. On phones the box is
 * a little over half the screen tall, so in portrait the scene is wider than the screen and the player
 * drags it sideways to look around, starting at the campfire; a landscape phone crops top and bottom.
 */
interface VillageSceneProps {
  /** The goal to light the campfire, while it is still out; `undefined` once it is lit. */
  campfire?: CampfireGoal
}

export function VillageScene({ campfire: goal }: VillageSceneProps = {}) {
  const { t } = useTranslation()
  const lit = goal === undefined
  const viewport = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = viewport.current
    if (!box) return
    const wide = window.matchMedia(WIDE_SCREEN)
    // Phones open centred on the campfire. Wide screens centre the scene with a transform, so a scroll offset
    // left from the phone layout would push it off centre, with no way to scroll it back: reset it.
    const place = () => {
      box.scrollLeft = wide.matches ? 0 : (box.scrollWidth - box.clientWidth) / 2
    }
    place()
    wide.addEventListener('change', place)
    return () => wide.removeEventListener('change', place)
  }, [])

  return (
    <div
      ref={viewport}
      className="relative h-[58dvh] w-full overflow-x-auto overflow-y-hidden overscroll-x-contain [container-type:size] [scrollbar-width:none] lg:h-auto lg:min-h-[320px] lg:flex-1 lg:overflow-hidden"
    >
      <div
        className="relative top-1/2 -translate-y-1/2 [--px:max(100cqw/320,100cqh/180)] lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        style={{ width: 'calc(320 * var(--px))', height: 'calc(180 * var(--px))' }}
      >
      <div
        role="img"
        aria-label={lit ? t('village.sceneLabel') : `${t('village.sceneLabel')} ${t('village.unlitLabel')}`}
        className="absolute inset-0 [&_*]:[image-rendering:pixelated]"
      >
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
        {lit ? (
        /* Campfire: the painted fire cut out of the scene, then an 8-frame strip holding only the pixels that
            change. Both brighten together while the pointer is over the fire. */
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
        ) : (
          <>
            {/* The cold campfire: the scene around the fire repainted with charred logs and no flame or smoke
                column, then a thin wisp rising from the logs in 16 frames. */}
            <img src={campfireOut} alt="" draggable={false} className="absolute" style={art(112, 32, 96, 112)} />
            <div
              aria-hidden
              className="absolute motion-safe:animate-village-smoke"
              style={{
                ...art(151, 76, 20, 44),
                backgroundImage: `url(${smoke})`,
                backgroundSize: 'calc(320 * var(--px)) 100%',
              }}
            />
          </>
        )}
      </div>
      {goal && (
        // The goal hangs above the smoke, its tail pointing at the fire. On a short scene (phones) it comes down
        // just enough to keep its top inside the box, which crops anything above it.
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: 'calc(161.5 * var(--px))', top: 'max(calc(74 * var(--px)), 13rem)' }}
        >
          <CampfirePopup {...goal} />
        </div>
      )}
      </div>
    </div>
  )
}
