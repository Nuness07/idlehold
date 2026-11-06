import { useTranslation } from 'react-i18next'
import { VillageScene } from './VillageScene'

/** The village screen, the game's hub: the scene across the middle column. */
export function VillageView() {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="village-name">
      {/* The name stays as the screen's heading for assistive tech; its painted board is not decided yet. */}
      <h1 id="village-name" className="sr-only">
        {t('village.defaultName')}
      </h1>
      <VillageScene />
    </section>
  )
}
