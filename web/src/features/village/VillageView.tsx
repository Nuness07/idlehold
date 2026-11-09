import { useTranslation } from 'react-i18next'
import type { CampfireGoal } from './CampfirePopup'
import { VillageScene } from './VillageScene'

interface VillageViewProps {
  /** The goal to light the campfire, while it is still out. */
  campfire?: CampfireGoal
}

/** The village screen, the game's hub: the scene filling the middle column. */
export function VillageView({ campfire }: VillageViewProps = {}) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="village-name" className="flex flex-col lg:flex-1">
      {/* The name stays as the screen's heading for assistive tech; its painted board is not decided yet. */}
      <h1 id="village-name" className="sr-only">
        {t('village.defaultName')}
      </h1>
      <VillageScene campfire={campfire} />
    </section>
  )
}
