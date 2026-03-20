import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import type { ActivitySession, AppStat, HourlyActivity, DayStats, Category } from '../shared/types'
import { CATEGORY_COLORS } from '../shared/types'

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
  appName: string,
  appPath: string,
  windowTitle: string,
  startTime: number,
  date: string,
  category: string,
  color: string
): number {
  const stmt = getDb().prepare(`
    INSERT INTO sessions (app_name, app_path, window_title, start_time, date, category, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(appName, appPath, windowTitle, startTime, date, category, color)
  return result.lastInsertRowid as number
}

export function updateSession(id: number, endTime: number): void {
  const session = getDb()
    .prepare('SELECT start_time FROM sessions WHERE id = ?')
    .get(id) as { start_time: number } | undefined
  if (!session) return

  const duration = Math.round((endTime - session.start_time) / 1000)
  getDb()
    .prepare('UPDATE sessions SET end_time = ?, duration = ? WHERE id = ?')
    .run(endTime, duration, id)
}

export function getStatsForDate(date: string): DayStats {
  const db = getDb()

  const sessions = db
    .prepare(
      `SELECT app_name, category, color, SUM(duration) as total, COUNT(*) as count
       FROM sessions
       WHERE date = ? AND duration IS NOT NULL AND duration > 0
       GROUP BY app_name, category, color
       ORDER BY total DESC`
    )
    .all(date) as { app_name: string; category: string; color: string; total: number; count: number }[]

  const totalTime = sessions.reduce((sum, s) => sum + (s.total || 0), 0)

  const appStats: AppStat[] = sessions.map((s) => ({
    appName: s.app_name,
    category: s.category,
    color: s.color,
    totalDuration: s.total || 0,
    sessionCount: s.count,
    percentage: totalTime > 0 ? Math.round(((s.total || 0) / totalTime) * 100) : 0
  }))

  // Hourly breakdown
  const hourlyData = db
    .prepare(
      `SELECT
        CAST((start_time - ?) / 3600000 % 24 AS INTEGER) as hour,
        app_name, category, color,
        SUM(duration) as total
       FROM sessions
       WHERE date = ? AND duration IS NOT NULL AND duration > 0
       GROUP BY hour, app_name
       ORDER BY hour`
    )
    .all(getDateStartMs(date), date) as {
    hour: number
    app_name: string
    category: string
    color: string
    total: number
  }[]

  const hourlyMap = new Map<number, HourlyActivity>()
  for (let h = 0; h < 24; h++) {
    hourlyMap.set(h, {
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      duration: 0,
      apps: []
    })
  }

  for (const row of hourlyData) {
    const h = Math.max(0, Math.min(23, row.hour))
    const hourEntry = hourlyMap.get(h)!
    hourEntry.duration += row.total || 0
    hourEntry.apps.push({ appName: row.app_name, duration: row.total || 0, color: row.color })
  }

  const topApp = appStats[0]?.appName ?? ''
  const categoryTotals = new Map<string, number>()
  for (const s of appStats) {
    categoryTotals.set(s.category, (categoryTotals.get(s.category) ?? 0) + s.totalDuration)
  }
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  return {
    date,
    totalTime,
    topApp,
    topCategory,
    appStats,
    hourlyActivity: Array.from(hourlyMap.values())
  }
}

export function getSessionsForDate(date: string): ActivitySession[] {
  return getDb()
    .prepare(
      `SELECT id, app_name as appName, app_path as appPath, window_title as windowTitle,
              start_time as startTime, end_time as endTime, duration, date, category, color
       FROM sessions
       WHERE date = ?
       ORDER BY start_time ASC`
    )
    .all(date) as ActivitySession[]
}

export function getStatsRange(startDate: string, endDate: string): { date: string; totalTime: number }[] {
  return getDb()
    .prepare(
      `SELECT date, SUM(duration) as totalTime
       FROM sessions
       WHERE date >= ? AND date <= ? AND duration IS NOT NULL
       GROUP BY date
       ORDER BY date ASC`
    )
    .all(startDate, endDate) as { date: string; totalTime: number }[]
}

export function setCategory(appName: string, category: string): void {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#64748b'
  getDb()
    .prepare('INSERT OR REPLACE INTO categories (app_name, category, color) VALUES (?, ?, ?)')
    .run(appName, category, color)

  // Update existing sessions
  getDb()
    .prepare('UPDATE sessions SET category = ?, color = ? WHERE app_name = ?')
    .run(category, color, appName)
}

export function getCategories(): Category[] {
  return getDb().prepare('SELECT app_name as appName, category, color FROM categories').all() as Category[]
}

function getDateStartMs(date: string): number {
  return new Date(date + 'T00:00:00.000').getTime()
}
