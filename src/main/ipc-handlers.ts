import { ipcMain } from 'electron'
import {
  getStatsForDate,
  getSessionsForDate,
  getStatsRange,
  setCategory,
  getCategories
} from './db'
import { getCurrentActivity, setCustomCategory } from './tracker'
import { CATEGORY_COLORS } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('get-stats-today', () => {
    const today = getTodayDate()
    return getStatsForDate(today)
  })

  ipcMain.handle('get-stats-date', (_event, date: string) => {
    return getStatsForDate(date)
  })

  ipcMain.handle('get-sessions-date', (_event, date: string) => {
    return getSessionsForDate(date)
  })

  ipcMain.handle('get-stats-range', (_event, startDate: string, endDate: string) => {
    return getStatsRange(startDate, endDate)
  })

  ipcMain.handle('get-current-activity', () => {
    return getCurrentActivity()
  })

  ipcMain.handle('set-category', (_event, appName: string, category: string) => {
    const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#64748b'
    setCategory(appName, category)
    setCustomCategory(appName, category, color)
  })

  ipcMain.handle('get-categories', () => {
    return getCategories()
  })
}

function getTodayDate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
