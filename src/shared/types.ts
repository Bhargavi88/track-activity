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

export interface CategoryStat {
  category: string
  color: string
  totalDuration: number
  percentage: number
}

export interface HourlyActivity {
  hour: number
  label: string
  duration: number
  apps: { appName: string; duration: number; color: string }[]
}

export interface ProductivityScore {
  score: number           // 0-100
  productiveTime: number  // seconds
  neutralTime: number
  distractingTime: number
  totalTime: number
}

export interface DayStats {
  date: string
  totalTime: number
  topApp: string
  topCategory: string
  appStats: AppStat[]
  categoryStats: CategoryStat[]
  hourlyActivity: HourlyActivity[]
  productivity: ProductivityScore
}

export interface WeekComparison {
  thisWeek: number
  lastWeek: number
  change: number  // percentage change
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
  | 'Social'
  | 'System'
  | 'Other'

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  Development: '#7c6cf5',
  Browser: '#4f8ef7',
  Communication: '#34d399',
  Design: '#fbbf24',
  Productivity: '#8b5cf6',
  Entertainment: '#f472b6',
  Social: '#fb923c',
  System: '#94a3b8',
  Other: '#64748b'
}

// How productive each category is: 1=productive, 0=neutral, -1=distracting
export const CATEGORY_PRODUCTIVITY: Record<CategoryName, 1 | 0 | -1> = {
  Development: 1,
  Productivity: 1,
  Design: 1,
  Communication: 1,
  Browser: 0,
  System: 0,
  Other: 0,
  Social: -1,
  Entertainment: -1
}

export const CATEGORY_ICONS: Record<CategoryName, string> = {
  Development: '💻',
  Browser: '🌐',
  Communication: '💬',
  Design: '🎨',
  Productivity: '📋',
  Entertainment: '🎵',
  Social: '👥',
  System: '⚙️',
  Other: '📦'
}
