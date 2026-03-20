// Re-export shared types for renderer use
export type {
  ActivitySession,
  AppStat,
  HourlyActivity,
  DayStats,
  CurrentActivity,
  Category,
  CategoryName
} from '../../shared/types'

export { CATEGORY_COLORS } from '../../shared/types'

// Window API types
declare global {
  interface Window {
    api: {
      getStatsToday: () => Promise<import('../../shared/types').DayStats>
      getStatsDate: (date: string) => Promise<import('../../shared/types').DayStats>
      getSessionsDate: (date: string) => Promise<import('../../shared/types').ActivitySession[]>
      getStatsRange: (
        startDate: string,
        endDate: string
      ) => Promise<{ date: string; totalTime: number }[]>
      getCurrentActivity: () => Promise<import('../../shared/types').CurrentActivity | null>
      setCategory: (appName: string, category: string) => Promise<void>
      getCategories: () => Promise<import('../../shared/types').Category[]>
      onActivityChanged: (
        callback: (activity: import('../../shared/types').CurrentActivity) => void
      ) => () => void
    }
  }
}
