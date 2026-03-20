export type {
  ActivitySession, AppStat, CategoryStat, HourlyActivity,
  DayStats, CurrentActivity, Category, CategoryName, ProductivityScore
} from '../../shared/types'

export { CATEGORY_COLORS, CATEGORY_PRODUCTIVITY, CATEGORY_ICONS } from '../../shared/types'

declare global {
  interface Window {
    api: {
      getStatsToday: () => Promise<import('../../shared/types').DayStats>
      getStatsDate: (date: string) => Promise<import('../../shared/types').DayStats>
      getSessionsDate: (date: string) => Promise<import('../../shared/types').ActivitySession[]>
      getStatsRange: (s: string, e: string) => Promise<{ date: string; totalTime: number }[]>
      getCurrentActivity: () => Promise<import('../../shared/types').CurrentActivity | null>
      setCategory: (appName: string, category: string) => Promise<void>
      getCategories: () => Promise<import('../../shared/types').Category[]>
      exportCsv: (start: string, end: string) => Promise<{ success: boolean; filePath?: string }>
      clearData: (beforeDate?: string) => Promise<void>
      getDataPath: () => Promise<string>
      onActivityChanged: (
        cb: (activity: import('../../shared/types').CurrentActivity) => void
      ) => () => void
    }
  }
}
