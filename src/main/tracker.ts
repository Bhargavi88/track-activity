import { BrowserWindow } from 'electron'
import { insertSession, updateSession } from './db'
import { getFriendlyName, classifyApp } from './app-classifier'
import type { CurrentActivity } from '../shared/types'

interface ActiveSession {
  id: number
  appName: string
  windowTitle: string
  category: string
  color: string
  startTime: number
}

let currentSession: ActiveSession | null = null
let trackingInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null

// Custom categories override (loaded from DB on start)
const customCategories = new Map<string, { category: string; color: string }>()

export function setCustomCategory(appName: string, category: string, color: string): void {
  customCategories.set(appName, { category, color })
}

export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

export function startTracking(): void {
  if (trackingInterval) return

  trackingInterval = setInterval(async () => {
    try {
      // Dynamic import for ESM active-win
      const { default: activeWin } = await import('active-win')
      const result = await activeWin()

      if (!result) return

      const exeName = result.owner.name
      const appPath = result.owner.path ?? ''
      const friendlyName = getFriendlyName(exeName)
      const windowTitle = result.title ?? ''
      const now = Date.now()
      const date = getLocalDateString(now)

      // Check custom category first
      const custom = customCategories.get(friendlyName)
      const { category, color } = custom ?? classifyApp(exeName)

      if (currentSession && currentSession.appName === friendlyName) {
        // Same app - just keep going, update heartbeat every 30s
        if (now - currentSession.startTime > 30000) {
          updateSession(currentSession.id, now)
        }
      } else {
        // App switched - close old session
        if (currentSession) {
          updateSession(currentSession.id, now)
        }

        // Start new session
        const sessionId = insertSession(friendlyName, appPath, windowTitle, now, date, category, color)
        currentSession = {
          id: sessionId,
          appName: friendlyName,
          windowTitle,
          category,
          color,
          startTime: now
        }

        // Notify renderer
        mainWindow?.webContents?.send('activity-changed', getCurrentActivity())
      }
    } catch (err) {
      // active-win might not be available on non-Windows in dev mode
      if (process.platform !== 'win32') {
        simulateActivity()
      }
    }
  }, 2000) // Poll every 2 seconds
}

export function stopTracking(): void {
  if (trackingInterval) {
    clearInterval(trackingInterval)
    trackingInterval = null
  }
  if (currentSession) {
    updateSession(currentSession.id, Date.now())
    currentSession = null
  }
}

export function getCurrentActivity(): CurrentActivity | null {
  if (!currentSession) return null
  return {
    appName: currentSession.appName,
    windowTitle: currentSession.windowTitle,
    category: currentSession.category,
    color: currentSession.color,
    duration: Math.round((Date.now() - currentSession.startTime) / 1000),
    startTime: currentSession.startTime
  }
}

function getLocalDateString(timestamp: number): string {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Development simulation for non-Windows platforms
const DEMO_APPS = [
  { name: 'Visual Studio Code', exe: 'code.exe', title: 'App.tsx — track-activity' },
  { name: 'Google Chrome', exe: 'chrome.exe', title: 'GitHub - track-activity' },
  { name: 'Slack', exe: 'slack.exe', title: '#general - Slack' },
  { name: 'Google Chrome', exe: 'chrome.exe', title: 'LinkedIn - Professional Network' },
  { name: 'Windows Terminal', exe: 'windowsterminal.exe', title: 'PowerShell' },
  { name: 'Notion', exe: 'notion.exe', title: 'My Notes - Notion' },
  { name: 'Spotify', exe: 'spotify.exe', title: 'Spotify' }
]

let demoIndex = 0
let demoTimer = 0

function simulateActivity(): void {
  demoTimer++
  // Change app every ~30 ticks (60s)
  if (demoTimer % 30 === 0) {
    demoIndex = (demoIndex + 1) % DEMO_APPS.length
  }

  const demoApp = DEMO_APPS[demoIndex]
  const now = Date.now()
  const date = getLocalDateString(now)
  const { category, color } = classifyApp(demoApp.exe)

  if (!currentSession || currentSession.appName !== demoApp.name) {
    if (currentSession) {
      updateSession(currentSession.id, now)
    }
    const sessionId = insertSession(demoApp.name, '', demoApp.title, now, date, category, color)
    currentSession = {
      id: sessionId,
      appName: demoApp.name,
      windowTitle: demoApp.title,
      category,
      color,
      startTime: now
    }
    mainWindow?.webContents?.send('activity-changed', getCurrentActivity())
  } else if (now - currentSession.startTime > 30000) {
    updateSession(currentSession.id, now)
  }
}
