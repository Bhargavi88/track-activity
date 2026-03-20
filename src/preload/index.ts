import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DayStats, ActivitySession, CurrentActivity, Category } from '../shared/types'

const api = {
  getStatsToday: (): Promise<DayStats> => ipcRenderer.invoke('get-stats-today'),
  getStatsDate: (date: string): Promise<DayStats> => ipcRenderer.invoke('get-stats-date', date),
  getSessionsDate: (date: string): Promise<ActivitySession[]> => ipcRenderer.invoke('get-sessions-date', date),
  getStatsRange: (start: string, end: string): Promise<{ date: string; totalTime: number }[]> =>
    ipcRenderer.invoke('get-stats-range', start, end),
  getCurrentActivity: (): Promise<CurrentActivity | null> => ipcRenderer.invoke('get-current-activity'),
  setCategory: (appName: string, category: string): Promise<void> =>
    ipcRenderer.invoke('set-category', appName, category),
  getCategories: (): Promise<Category[]> => ipcRenderer.invoke('get-categories'),
  exportCsv: (start: string, end: string): Promise<{ success: boolean; filePath?: string }> =>
    ipcRenderer.invoke('export-csv', start, end),
  clearData: (beforeDate?: string): Promise<void> => ipcRenderer.invoke('clear-data', beforeDate),
  getDataPath: (): Promise<string> => ipcRenderer.invoke('get-data-path'),
  onActivityChanged: (cb: (activity: CurrentActivity) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, a: CurrentActivity): void => cb(a)
    ipcRenderer.on('activity-changed', handler)
    return () => ipcRenderer.removeListener('activity-changed', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (e) {
    console.error(e)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
