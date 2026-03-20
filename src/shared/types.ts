export interface ActivitySession {
  id: number
  appName: string
  appPath: string
  windowTitle: string
  startTime: number
  endTime: number | null
  duration: number | null
  date: string
  category: string
  color: string
}

export interface AppStat {
  appName: string
  category: string
  color: string
  totalDuration: number
  sessionCount: number
  percentage: number
}

export interface HourlyActivity {
  hour: number
  label: string
  duration: number
  apps: { appName: string; duration: number; color: string }[]
}

export interface DayStats {
  date: string
  totalTime: number
  topApp: string
  topCategory: string
  appStats: AppStat[]
  hourlyActivity: HourlyActivity[]
}

export interface CurrentActivity {
  appName: string
  windowTitle: string
  category: string
  color: string
  duration: number
  startTime: number
}

export interface Category {
  appName: string
  category: string
  color: string
}

export type CategoryName =
  | 'Development'
  | 'Browser'
  | 'Communication'
  | 'Design'
  | 'Productivity'
  | 'Entertainment'
  | 'System'
  | 'Other'

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  Development: '#7c6cf5',
  Browser: '#4f8ef7',
  Communication: '#34d399',
  Design: '#fbbf24',
  Productivity: '#8b5cf6',
  Entertainment: '#f472b6',
  System: '#94a3b8',
  Other: '#64748b'
}
