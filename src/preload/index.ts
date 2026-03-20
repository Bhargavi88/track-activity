import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DayStats, ActivitySession, AppStat, CurrentActivity, Category } from '../shared/types'

const api = {
  getStatsToday: (): Promise<DayStats> => ipcRenderer.invoke('get-stats-today'),

  getStatsDate: (date: string): Promise<DayStats> => ipcRenderer.invoke('get-stats-date', date),

  getSessionsDate: (date: string): Promise<ActivitySession[]> =>
    ipcRenderer.invoke('get-sessions-date', date),

  getStatsRange: (
    startDate: string,
    endDate: string
  ): Promise<{ date: string; totalTime: number }[]> =>
    ipcRenderer.invoke('get-stats-range', startDate, endDate),

  getCurrentActivity: (): Promise<CurrentActivity | null> =>
    ipcRenderer.invoke('get-current-activity'),

  setCategory: (appName: string, category: string): Promise<void> =>
    ipcRenderer.invoke('set-category', appName, category),

  getCategories: (): Promise<Category[]> => ipcRenderer.invoke('get-categories'),

  onActivityChanged: (callback: (activity: CurrentActivity) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, activity: CurrentActivity): void =>
      callback(activity)
    ipcRenderer.on('activity-changed', handler)
    return () => ipcRenderer.removeListener('activity-changed', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
