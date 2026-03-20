// Mock API for browser-based development (no Electron needed)
import type { DayStats, ActivitySession, CurrentActivity, Category } from '../types'
import { getTodayStr, getYesterdayStr } from '../utils/format'

const APPS = [
  { name: 'Visual Studio Code', color: '#7c6cf5', category: 'Development' },
  { name: 'Google Chrome', color: '#4f8ef7', category: 'Browser' },
  { name: 'Slack', color: '#34d399', category: 'Communication' },
  { name: 'Figma', color: '#fbbf24', category: 'Design' },
  { name: 'Microsoft Edge', color: '#4f8ef7', category: 'Browser' },
  { name: 'Windows Terminal', color: '#7c6cf5', category: 'Development' },
  { name: 'Notion', color: '#8b5cf6', category: 'Productivity' },
  { name: 'Spotify', color: '#f472b6', category: 'Entertainment' },
  { name: 'Zoom', color: '#34d399', category: 'Communication' },
  { name: 'GitHub (Chrome)', color: '#4f8ef7', category: 'Browser' },
]

const WINDOW_TITLES: Record<string, string[]> = {
  'Visual Studio Code': ['App.tsx — track-activity', 'db.ts — track-activity', 'README.md'],
  'Google Chrome': ['GitHub - Bhargavi88/track-activity', 'LinkedIn - Professional Network', 'Stack Overflow'],
  'Slack': ['#general - Workspace', '#dev-team - Workspace'],
  'Figma': ['Dashboard Design — Figma'],
  'Microsoft Edge': ['Microsoft Edge'],
  'Windows Terminal': ['PowerShell', 'bash'],
  'Notion': ['My Notes — Notion'],
  'Spotify': ['Spotify'],
  'Zoom': ['Zoom Meeting'],
  'GitHub (Chrome)': ['track-activity — GitHub'],
}

function makeSessions(date: string): ActivitySession[] {
  const base = new Date(date + 'T09:00:00').getTime()
  const sessions: ActivitySession[] = []
  let id = 1
  let cursor = base

  const plan = [
    { app: 'Visual Studio Code', mins: 45 },
    { app: 'Google Chrome', mins: 20 },
    { app: 'Slack', mins: 10 },
    { app: 'Visual Studio Code', mins: 60 },
    { app: 'Zoom', mins: 30 },
    { app: 'Visual Studio Code', mins: 90 },
    { app: 'Google Chrome', mins: 25 },
    { app: 'Figma', mins: 40 },
    { app: 'Slack', mins: 8 },
    { app: 'Notion', mins: 15 },
    { app: 'Visual Studio Code', mins: 55 },
    { app: 'Spotify', mins: 5 },
    { app: 'Windows Terminal', mins: 20 },
    { app: 'Google Chrome', mins: 30 },
  ]

  for (const p of plan) {
    const app = APPS.find((a) => a.name === p.app)!
    const startTime = cursor
    const endTime = cursor + p.mins * 60 * 1000
    const titles = WINDOW_TITLES[p.app] ?? [p.app]
    sessions.push({
      id: id++,
      appName: app.name,
      appPath: '',
      windowTitle: titles[Math.floor(Math.random() * titles.length)],
      startTime,
      endTime,
      duration: p.mins * 60,
      date,
      category: app.category,
      color: app.color,
    })
    cursor = endTime + 2000
  }
  return sessions
}

function sessionsToStats(date: string, sessions: ActivitySession[]): DayStats {
  const appMap = new Map<string, { duration: number; count: number; category: string; color: string }>()
  for (const s of sessions) {
    const ex = appMap.get(s.appName) ?? { duration: 0, count: 0, category: s.category, color: s.color }
    ex.duration += s.duration ?? 0
    ex.count++
    appMap.set(s.appName, ex)
  }

  const totalTime = [...appMap.values()].reduce((sum, v) => sum + v.duration, 0)
  const appStats = [...appMap.entries()]
    .sort((a, b) => b[1].duration - a[1].duration)
    .map(([name, v]) => ({
      appName: name,
      category: v.category,
      color: v.color,
      totalDuration: v.duration,
      sessionCount: v.count,
      percentage: totalTime > 0 ? Math.round((v.duration / totalTime) * 100) : 0,
    }))

  const hourlyMap = new Map<number, { duration: number; apps: { appName: string; duration: number; color: string }[] }>()
  for (let h = 0; h < 24; h++) hourlyMap.set(h, { duration: 0, apps: [] })
  for (const s of sessions) {
    const h = new Date(s.startTime).getHours()
    const entry = hourlyMap.get(h)!
    entry.duration += s.duration ?? 0
    entry.apps.push({ appName: s.appName, duration: s.duration ?? 0, color: s.color })
  }

  const categoryTotals = new Map<string, number>()
  for (const s of appStats) categoryTotals.set(s.category, (categoryTotals.get(s.category) ?? 0) + s.totalDuration)
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  return {
    date,
    totalTime,
    topApp: appStats[0]?.appName ?? '',
    topCategory,
    appStats,
    hourlyActivity: Array.from(hourlyMap.entries()).map(([hour, v]) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      duration: v.duration,
      apps: v.apps,
    })),
  }
}

const todaySessions = makeSessions(getTodayStr())
const yesterdaySessions = makeSessions(getYesterdayStr())

const sessionCache = new Map<string, ActivitySession[]>([
  [getTodayStr(), todaySessions],
  [getYesterdayStr(), yesterdaySessions],
])

let activityCallbacks: ((a: CurrentActivity) => void)[] = []
let currentAppIndex = 0
let sessionStart = Date.now()

// Simulate live activity changes
setInterval(() => {
  currentAppIndex = (currentAppIndex + 1) % APPS.length
  sessionStart = Date.now()
  const app = APPS[currentAppIndex]
  activityCallbacks.forEach((cb) =>
    cb({ appName: app.name, windowTitle: WINDOW_TITLES[app.name]?.[0] ?? app.name, category: app.category, color: app.color, duration: 0, startTime: sessionStart })
  )
}, 8000)

export const mockApi: Window['api'] = {
  getStatsToday: async () => sessionsToStats(getTodayStr(), todaySessions),

  getStatsDate: async (date) => {
    if (!sessionCache.has(date)) {
      // Generate some data for past dates
      const s = makeSessions(date)
      sessionCache.set(date, s)
    }
    return sessionsToStats(date, sessionCache.get(date)!)
  },

  getSessionsDate: async (date) => {
    if (!sessionCache.has(date)) sessionCache.set(date, makeSessions(date))
    return sessionCache.get(date)!
  },

  getStatsRange: async (startDate, endDate) => {
    const results: { date: string; totalTime: number }[] = []
    const start = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')
    const cur = new Date(start)
    while (cur <= end) {
      const d = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      if (!sessionCache.has(d)) sessionCache.set(d, makeSessions(d))
      const total = sessionCache.get(d)!.reduce((s, sess) => s + (sess.duration ?? 0), 0)
      results.push({ date: d, totalTime: total })
      cur.setDate(cur.getDate() + 1)
    }
    return results
  },

  getCurrentActivity: async () => {
    const app = APPS[currentAppIndex]
    return {
      appName: app.name,
      windowTitle: WINDOW_TITLES[app.name]?.[0] ?? app.name,
      category: app.category,
      color: app.color,
      duration: Math.round((Date.now() - sessionStart) / 1000),
      startTime: sessionStart,
    }
  },

  setCategory: async (appName, category) => {
    console.log('[mock] setCategory', appName, '->', category)
  },

  getCategories: async (): Promise<Category[]> => [],

  onActivityChanged: (cb) => {
    activityCallbacks.push(cb)
    return () => { activityCallbacks = activityCallbacks.filter((f) => f !== cb) }
  },
}
