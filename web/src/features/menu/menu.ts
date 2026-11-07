import achievementsIcon from '../../assets/menu/achievements.png'
import historyIcon from '../../assets/menu/history.png'
import settingsIcon from '../../assets/menu/settings.png'
import statisticsIcon from '../../assets/menu/statistics.png'
import storehouseIcon from '../../assets/menu/storehouse.png'

/** The screens the hold menu opens, in the order it lists them. Settings sits apart, on the profile card. */
export const menuScreens = ['storehouse', 'achievements', 'history', 'statistics'] as const
export type MenuScreen = (typeof menuScreens)[number]

/** What the middle of the screen shows: the village, a trade, or a screen from the hold menu. */
export type Screen = 'village' | 'trade' | MenuScreen | 'settings'

/** The 32x32 pixel-art icon of each menu entry. */
export const menuIcon: Record<MenuScreen | 'settings', string> = {
  storehouse: storehouseIcon,
  achievements: achievementsIcon,
  history: historyIcon,
  statistics: statisticsIcon,
  settings: settingsIcon,
}
