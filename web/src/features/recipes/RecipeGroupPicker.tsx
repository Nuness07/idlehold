import { useTranslation } from 'react-i18next'
import { PixelSprite } from '../../components/PixelSprite'
import { recipeGroupSprite } from '../../content/labels'
import { useContentText } from '../../content/text'
import { cn } from '../../lib/cn'
import type { RecipeGroupData } from './recipeGroups'

interface RecipeGroupPickerProps {
  skillId: string
  groups: RecipeGroupData[]
  selected: string | undefined
  onSelect: (groupId: string) => void
}

/**
 * The headings a trade splits its recipes under (a station in Cooking, a material in Crafting). Picking one lists
 * its recipes below. A group with no recipes yet shows as a black silhouette, so the player sees what is coming.
 */
export function RecipeGroupPicker({ skillId, groups, selected, onSelect }: RecipeGroupPickerProps) {
  const { t } = useTranslation()
  const text = useContentText()
  if (groups.length === 0) return null

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-xs font-extrabold tracking-[0.14em] text-parchment uppercase">
        {text.recipeGroupLegend(skillId)}
      </legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {groups.map((group) => {
          const sprite = recipeGroupSprite(group.id)
          const chosen = group.id === selected
          return (
            <label
              key={group.id}
              className={cn(
                'flex items-center gap-3 rounded-sm border-2 px-3 py-2 has-focus-visible:outline-2 has-focus-visible:outline-parchment',
                chosen ? 'border-ochre bg-ochre-wash' : 'border-rule bg-limewash',
                group.open ? 'cursor-pointer' : 'cursor-not-allowed bg-stone',
              )}
            >
              <input
                type="radio"
                name={`recipe-group-${skillId}`}
                value={group.id}
                checked={chosen}
                disabled={!group.open}
                onChange={() => onSelect(group.id)}
                className="sr-only"
              />
              {sprite && (
                <PixelSprite
                  src={sprite.src}
                  width={sprite.width}
                  height={sprite.height}
                  className={cn(!group.open && 'brightness-0 opacity-80')}
                />
              )}
              <span className="min-w-0 leading-tight">
                <span className={cn('block font-extrabold', !group.open && 'text-muted')}>{text.recipeGroupName(group.id)}</span>
                {!group.open && <span className="block text-[13px] text-muted">{t('recipeGroups.comingSoon')}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
