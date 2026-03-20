import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import type {
  ActivitySession, AppStat, CategoryStat, HourlyActivity,
  DayStats, Category, ProductivityScore
} from '../shared/types'
import { CATEGORY_COLORS, CATEGORY_PRODUCTIVITY } from '../shared/types'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'activity.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    initDb(db)
  }
  return db
}

function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT NOT NULL,
      app_path TEXT DEFAULT '',
      window_title TEXT DEFAULT '',
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      color TEXT DEFAULT '#64748b'
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_sessions_app ON sessions(app_name);
    CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);

    CREATE TABLE IF NOT EXISTS categories (
      app_name TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT 'Other',
      color TEXT NOT NULL DEFAULT '#64748b'
    );
  `)
}

export function insertSession(
  appName: string, appPath: string, windowTitle: string,
  startTime: number, date: string, category: string, color: string
): number {
  const result = getDb()
    .prepare(`INSERT INTO sessions (app_name, app_path, window_title, start_time, date, category, color)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(appName, appPath, windowTitle, startTime, date, category, color)
  return result.lastInsertRowid as number
}

export function updateSession(id: number, endTime: number): void {
  const row = getDb().prepare('SELECT start_time FROM sessions WHERE id = ?').get(id) as { start_time: number } | undefined
  if (!row) return
  const duration = Math.max(1, Math.round((endTime - row.start_time) / 1000))
  getDb().prepare('UPDATE sessions SET end_time = ?, duration = ? WHERE id = ?').run(endTime, duration, id)
}

export function getStatsForDate(date: string): DayStats {
  const db = getDb()

  const rows = db.prepare(`
    SELECT app_name, category, color, SUM(duration) as total, COUNT(*) as cnt
    FROM sessions WHERE date = ? AND duration > 0
    GROUP BY app_name, category, color ORDER BY total DESC
  `).all(date) as { app_name: string; category: string; color: string; total: number; cnt: number }[]

  const totalTime = rows.reduce((s, r) => s + r.total, 0)

  const appStats: AppStat[] = rows.map((r) => ({
    appName: r.app_name,
    category: r.category,
    color: r.color,
    totalDuration: r.total,
    sessionCount: r.cnt,
    percentage: totalTime > 0 ? Math.round((r.total / totalTime) * 100) : 0
  }))

  // Category stats
  const catMap = new Map<string, { color: string; total: number }>()
  for (const r of rows) {
    const ex = catMap.get(r.category) ?? { color: r.color, total: 0 }
    ex.total += r.total
    catMap.set(r.category, ex)
  }
  const categoryStats: CategoryStat[] = [...catMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, v]) => ({
      category: cat,
      color: v.color,
      totalDuration: v.total,
      percentage: totalTime > 0 ? Math.round((v.total / totalTime) * 100) : 0
    }))

  // Hourly activity
  const dateStartMs = new Date(date + 'T00:00:00').getTime()
  const hourRows = db.prepare(`
    SELECT CAST((start_time - ?) / 3600000 AS INTEGER) as hour,
           app_name, category, color, SUM(duration) as total
    FROM sessions WHERE date = ? AND duration > 0
    GROUP BY hour, app_name ORDER BY hour
  `).all(dateStartMs, date) as { hour: number; app_name: string; color: string; total: number }[]

  const hourMap = new Map<number, HourlyActivity>()
  for (let h = 0; h < 24; h++) {
    hourMap.set(h, { hour: h, label: `${String(h).padStart(2, '0')}:00`, duration: 0, apps: [] })
  }
  for (const r of hourRows) {
    const h = Math.max(0, Math.min(23, r.hour))
    const entry = hourMap.get(h)!
    entry.duration += r.total
    entry.apps.push({ appName: r.app_name, duration: r.total, color: r.color })
  }

  // Productivity score
  let productiveTime = 0, neutralTime = 0, distractingTime = 0
  for (const r of rows) {
    const rating = CATEGORY_PRODUCTIVITY[r.category as keyof typeof CATEGORY_PRODUCTIVITY] ?? 0
    if (rating === 1) productiveTime += r.total
    else if (rating === -1) distractingTime += r.total
    else neutralTime += r.total
  }
  const score = totalTime > 0
    ? Math.round(((productiveTime + neutralTime * 0.5) / totalTime) * 100)
    : 0
  const productivity: ProductivityScore = { score, productiveTime, neutralTime, distractingTime, totalTime }

  const topApp = appStats[0]?.appName ?? ''
  const topCategory = categoryStats[0]?.category ?? ''

  return {
    date, totalTime, topApp, topCategory,
    appStats, categoryStats,
    hourlyActivity: Array.from(hourMap.values()),
    productivity
  }
}

export function getSessionsForDate(date: string): ActivitySession[] {
  return getDb().prepare(`
    SELECT id, app_name as appName, app_path as appPath, window_title as windowTitle,
           start_time as startTime, end_time as endTime, duration, date, category, color
    FROM sessions WHERE date = ? ORDER BY start_time ASC
  `).all(date) as ActivitySession[]
}

export function getStatsRange(startDate: string, endDate: string): { date: string; totalTime: number }[] {
  return getDb().prepare(`
    SELECT date, SUM(duration) as totalTime
    FROM sessions WHERE date >= ? AND date <= ? AND duration > 0
    GROUP BY date ORDER BY date ASC
  `).all(startDate, endDate) as { date: string; totalTime: number }[]
}

export function exportToCsv(startDate: string, endDate: string): string {
  const rows = getDb().prepare(`
    SELECT app_name, category, date,
           strftime('%H:%M', datetime(start_time/1000, 'unixepoch')) as start_hm,
           strftime('%H:%M', datetime(end_time/1000, 'unixepoch')) as end_hm,
           duration
    FROM sessions
    WHERE date >= ? AND date <= ? AND duration > 0
    ORDER BY start_time ASC
  `).all(startDate, endDate) as { app_name: string; category: string; date: string; start_hm: string; end_hm: string; duration: number }[]

  const header = 'Date,App,Category,Start,End,Duration (s)\n'
  const lines = rows.map((r) =>
    `${r.date},"${r.app_name}",${r.category},${r.start_hm},${r.end_hm},${r.duration}`
  )
  return header + lines.join('\n')
}

export function setCategory(appName: string, category: string): void {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#64748b'
  getDb().prepare('INSERT OR REPLACE INTO categories (app_name, category, color) VALUES (?, ?, ?)').run(appName, category, color)
  getDb().prepare('UPDATE sessions SET category = ?, color = ? WHERE app_name = ?').run(category, color, appName)
}

export function getCategories(): Category[] {
  return getDb().prepare('SELECT app_name as appName, category, color FROM categories').all() as Category[]
}

export function clearData(beforeDate?: string): void {
  if (beforeDate) {
    getDb().prepare('DELETE FROM sessions WHERE date < ?').run(beforeDate)
  } else {
    getDb().prepare('DELETE FROM sessions').run()
  }
}
