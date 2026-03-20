import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import {
  getStatsForDate, getSessionsForDate, getStatsRange,
  setCategory, getCategories, exportToCsv, clearData
} from './db'
import { getCurrentActivity, setCustomCategory } from './tracker'
import { CATEGORY_COLORS } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('get-stats-today', () => getStatsForDate(todayStr()))
  ipcMain.handle('get-stats-date', (_e, date: string) => getStatsForDate(date))
  ipcMain.handle('get-sessions-date', (_e, date: string) => getSessionsForDate(date))
  ipcMain.handle('get-stats-range', (_e, start: string, end: string) => getStatsRange(start, end))
  ipcMain.handle('get-current-activity', () => getCurrentActivity())

  ipcMain.handle('set-category', (_e, appName: string, category: string) => {
    const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#64748b'
    setCategory(appName, category)
    setCustomCategory(appName, category, color)
  })

  ipcMain.handle('get-categories', () => getCategories())

  ipcMain.handle('export-csv', async (_e, startDate: string, endDate: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: path.join(app.getPath('downloads'), `activity-${startDate}-to-${endDate}.csv`),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (canceled || !filePath) return { success: false }
    const csv = exportToCsv(startDate, endDate)
    fs.writeFileSync(filePath, csv, 'utf8')
    return { success: true, filePath }
  })

  ipcMain.handle('clear-data', (_e, beforeDate?: string) => {
    clearData(beforeDate)
  })

  ipcMain.handle('get-data-path', () => app.getPath('userData'))
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
