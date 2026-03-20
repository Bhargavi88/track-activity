// Mock API for browser-based development (no Electron needed)
import type { DayStats, ActivitySession, CurrentActivity, Category, ProductivityScore, CategoryStat } from '../types'
import { CATEGORY_COLORS, CATEGORY_PRODUCTIVITY } from '../types'
import { getTodayStr, getYesterdayStr } from '../utils/format'

// Realistic workday sessions including browser sites
const SESSIONS_PLAN = [
  { name: 'Visual Studio Code', exe: 'code.exe', title: 'App.tsx — track-activity', mins: 55 },
  { name: 'GitHub', exe: 'chrome.exe', title: 'Bhargavi88/track-activity — GitHub', mins: 15 },
  { name: 'Stack Overflow', exe: 'chrome.exe', title: 'Stack Overflow - TypeScript question', mins: 8 },
  { name: 'Slack', exe: 'slack.exe', title: '#dev-team - Workspace', mins: 12 },
  { name: 'Visual Studio Code', exe: 'code.exe', title: 'tracker.ts — track-activity', mins: 70 },
  { name: 'ChatGPT', exe: 'chrome.exe', title: 'ChatGPT', mins: 10 },
  { name: 'LinkedIn', exe: 'chrome.exe', title: 'LinkedIn - Professional Network', mins: 18 },
  { name: 'Zoom', exe: 'zoom.exe', title: 'Team Standup', mins: 28 },
  { name: 'Notion', exe: 'notion.exe', title: 'Sprint Planning - Notion', mins: 20 },
  { name: 'Visual Studio Code', exe: 'code.exe', title: 'db.ts — track-activity', mins: 45 },
  { name: 'Figma', exe: 'figma.exe', title: 'Dashboard Design - Figma', mins: 35 },
  { name: 'Twitter / X', exe: 'chrome.exe', title: 'Twitter / X', mins: 7 },
  { name: 'YouTube', exe: 'chrome.exe', title: 'YouTube', mins: 12 },
  { name: 'Windows Terminal', exe: 'windowsterminal.exe', title: 'PowerShell — track-activity', mins: 22 },
  { name: 'Google Chrome', exe: 'chrome.exe', title: 'New Tab', mins: 5 },
  { name: 'Microsoft Outlook', exe: 'outlook.exe', title: 'Inbox - Outlook', mins: 14 },
]

type CategoryName = 'Development' | 'Browser' | 'Communication' | 'Design' | 'Productivity' | 'Entertainment' | 'Social' | 'System' | 'Other'

const EXE_CAT: Record<string, CategoryName> = {
  'code.exe': 'Development',
  'chrome.exe': 'Browser',
  'slack.exe': 'Communication',
  'zoom.exe': 'Communication',
  'notion.exe': 'Productivity',
  'figma.exe': 'Design',
  'windowsterminal.exe': 'Development',
  'outlook.exe': 'Communication',
}

// Browser site category overrides
const SITE_CAT: Record<string, CategoryName> = {
  'GitHub': 'Development',
  'Stack Overflow': 'Development',
  'ChatGPT': 'Productivity',
  'Vercel': 'Development',
  'LinkedIn': 'Social',
  'Twitter / X': 'Social',
  'YouTube': 'Entertainment',
  'Reddit': 'Social',
  'Hacker News': 'Social',
  'Gmail': 'Communication',
  'Google Docs': 'Productivity',
  'Google Sheets': 'Productivity',
  'Figma': 'Design',
  'Notion': 'Productivity',
}

function getCategory(name: string, exe: string): CategoryName {
  if (SITE_CAT[name]) return SITE_CAT[name]
  return EXE_CAT[exe] ?? 'Other'
}

function makeSessions(date: string, seed = 0): ActivitySession[] {
  const base = new Date(date + 'T08:30:00').getTime()
  let id = seed * 1000 + 1
  let cursor = base
  const sessions: ActivitySession[] = []

  // Vary mins slightly per day using seed
  for (const p of SESSIONS_PLAN) {
    const variance = ((seed * 7 + id * 3) % 20) - 10  // ±10 min variance
    const mins = Math.max(2, p.mins + variance)
    const category = getCategory(p.name, p.exe)
    const color = CATEGORY_COLORS[category]
    const startTime = cursor
    const endTime = cursor + mins * 60 * 1000
    sessions.push({
      id: id++,
      appName: p.name,
      appPath: '',
      windowTitle: p.title,
      startTime,
      endTime,
      duration: mins * 60,
      date,
      category,
      color,
    })
    cursor = endTime + 1500
  }
  return sessions
}

function buildStats(date: string, sessions: ActivitySession[]): DayStats {
  // App stats
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
      appName: name, category: v.category, color: v.color,
      totalDuration: v.duration, sessionCount: v.count,
      percentage: totalTime > 0 ? Math.round((v.duration / totalTime) * 100) : 0
    }))

  // Category stats
  const catMap = new Map<string, { color: string; total: number }>()
  for (const s of appStats) {
    const ex = catMap.get(s.category) ?? { color: s.color, total: 0 }
    ex.total += s.totalDuration
    catMap.set(s.category, ex)
  }
  const categoryStats: CategoryStat[] = [...catMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, v]) => ({
      category: cat, color: v.color, totalDuration: v.total,
      percentage: totalTime > 0 ? Math.round((v.total / totalTime) * 100) : 0
    }))

  // Hourly
  const hourMap = new Map<number, { duration: number; apps: { appName: string; duration: number; color: string }[] }>()
  for (let h = 0; h < 24; h++) hourMap.set(h, { duration: 0, apps: [] })
  for (const s of sessions) {
    const h = new Date(s.startTime).getHours()
    const entry = hourMap.get(h)!
    entry.duration += s.duration ?? 0
    entry.apps.push({ appName: s.appName, duration: s.duration ?? 0, color: s.color })
  }

  // Productivity
  let productiveTime = 0, neutralTime = 0, distractingTime = 0
  for (const s of appStats) {
    const rating = CATEGORY_PRODUCTIVITY[s.category as keyof typeof CATEGORY_PRODUCTIVITY] ?? 0
    if (rating === 1) productiveTime += s.totalDuration
    else if (rating === -1) distractingTime += s.totalDuration
    else neutralTime += s.totalDuration
  }
  const score = totalTime > 0 ? Math.round(((productiveTime + neutralTime * 0.5) / totalTime) * 100) : 0
  const productivity: ProductivityScore = { score, productiveTime, neutralTime, distractingTime, totalTime }

  return {
    date, totalTime, topApp: appStats[0]?.appName ?? '', topCategory: categoryStats[0]?.category ?? '',
    appStats, categoryStats,
    hourlyActivity: Array.from(hourMap.entries()).map(([hour, v]) => ({
      hour, label: `${String(hour).padStart(2, '0')}:00`, duration: v.duration, apps: v.apps
    })),
    productivity
  }
}

// Precompute some sessions
const sessionCache = new Map<string, ActivitySession[]>()

function getOrCreate(date: string): ActivitySession[] {
  if (!sessionCache.has(date)) {
    const seed = parseInt(date.replace(/-/g, '')) % 100
    sessionCache.set(date, makeSessions(date, seed))
  }
  return sessionCache.get(date)!
}

getOrCreate(getTodayStr())
getOrCreate(getYesterdayStr())

// Live activity simulation
let currentAppIdx = 0
let sessionStart = Date.now()
let activityCbs: ((a: CurrentActivity) => void)[] = []

const LIVE_APPS = [
  { name: 'Visual Studio Code', title: 'App.tsx — track-activity', category: 'Development', color: '#7c6cf5' },
  { name: 'GitHub', title: 'Bhargavi88/track-activity — GitHub', category: 'Development', color: '#7c6cf5' },
  { name: 'Slack', title: '#general - Workspace', category: 'Communication', color: '#34d399' },
  { name: 'ChatGPT', title: 'ChatGPT', category: 'Productivity', color: '#8b5cf6' },
  { name: 'LinkedIn', title: 'LinkedIn - Professional Network', category: 'Social', color: '#fb923c' },
  { name: 'Figma', title: 'Dashboard Design - Figma', category: 'Design', color: '#fbbf24' },
  { name: 'YouTube', title: 'YouTube', category: 'Entertainment', color: '#f472b6' },
]

setInterval(() => {
  currentAppIdx = (currentAppIdx + 1) % LIVE_APPS.length
  sessionStart = Date.now()
  const app = LIVE_APPS[currentAppIdx]
  activityCbs.forEach((cb) => cb({ ...app, duration: 0, startTime: sessionStart, windowTitle: app.title }))
}, 8000)

export const mockApi: Window['api'] = {
  getStatsToday: async () => buildStats(getTodayStr(), getOrCreate(getTodayStr())),
  getStatsDate: async (date) => buildStats(date, getOrCreate(date)),
  getSessionsDate: async (date) => getOrCreate(date),
  getStatsRange: async (startDate, endDate) => {
    const results: { date: string; totalTime: number }[] = []
    const start = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')
    const cur = new Date(start)
    while (cur <= end) {
      const d = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      const s = getOrCreate(d)
      results.push({ date: d, totalTime: s.reduce((t, x) => t + (x.duration ?? 0), 0) })
      cur.setDate(cur.getDate() + 1)
    }
    return results
  },
  getCurrentActivity: async () => {
    const app = LIVE_APPS[currentAppIdx]
    return { ...app, duration: Math.round((Date.now() - sessionStart) / 1000), startTime: sessionStart, windowTitle: app.title }
  },
  setCategory: async (appName, category) => console.log('[mock] setCategory', appName, '->', category),
  getCategories: async (): Promise<Category[]> => [],
  exportCsv: async () => { alert('[Mock] Export not available in browser mode. Run the desktop app.'); return { success: false } },
  clearData: async () => console.log('[mock] clearData'),
  getDataPath: async () => '%APPDATA%\\track-activity',
  onActivityChanged: (cb) => {
    activityCbs.push(cb)
    return () => { activityCbs = activityCbs.filter((f) => f !== cb) }
  },
}
