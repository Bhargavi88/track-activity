import { BrowserWindow } from 'electron'
import { insertSession, updateSession } from './db'
import { classifyWindow, classifyApp } from './app-classifier'
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
      const { default: activeWin } = await import('active-win')
      const result = await activeWin()
      if (!result) return

      const exeName = result.owner.name
      const appPath = result.owner.path ?? ''
      const windowTitle = result.title ?? ''
      const now = Date.now()
      const date = getLocalDateString(now)

      // Classify the window (handles browser site detection)
      const classified = classifyWindow(exeName, windowTitle)

      // Custom category overrides
      const custom = customCategories.get(classified.appName)
      const category = custom?.category ?? classified.category
      const color = custom?.color ?? classified.color

      if (currentSession && currentSession.appName === classified.appName) {
        // Still on same app — heartbeat update every 30s
        if (now - currentSession.startTime > 30000) {
          updateSession(currentSession.id, now)
        }
      } else {
        if (currentSession) updateSession(currentSession.id, now)

        const sessionId = insertSession(classified.appName, appPath, windowTitle, now, date, category, color)
        currentSession = { id: sessionId, appName: classified.appName, windowTitle, category, color, startTime: now }
        mainWindow?.webContents?.send('activity-changed', getCurrentActivity())
      }
    } catch {
      if (process.platform !== 'win32') simulateActivity()
    }
  }, 2000)
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

function getLocalDateString(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Demo simulation for non-Windows ──────────────────────────────────────────
const DEMO_APPS = [
  { name: 'Visual Studio Code', exe: 'code.exe', title: 'App.tsx — track-activity' },
  { name: 'GitHub', exe: 'chrome.exe', title: 'Bhargavi88/track-activity — GitHub' },
  { name: 'Slack', exe: 'slack.exe', title: '#general - Slack' },
  { name: 'LinkedIn', exe: 'chrome.exe', title: 'LinkedIn - Professional Network' },
  { name: 'Windows Terminal', exe: 'windowsterminal.exe', title: 'PowerShell' },
  { name: 'Notion', exe: 'notion.exe', title: 'My Notes - Notion' },
  { name: 'ChatGPT', exe: 'chrome.exe', title: 'ChatGPT' },
  { name: 'YouTube', exe: 'chrome.exe', title: 'YouTube' },
  { name: 'Figma', exe: 'figma.exe', title: 'Dashboard Design' },
  { name: 'Stack Overflow', exe: 'chrome.exe', title: 'Stack Overflow' },
]

let demoIndex = 0
let demoTick = 0

function simulateActivity(): void {
  demoTick++
  if (demoTick % 25 === 0) demoIndex = (demoIndex + 1) % DEMO_APPS.length

  const demo = DEMO_APPS[demoIndex]
  const now = Date.now()
  const date = getLocalDateString(now)
  const classified = classifyWindow(demo.exe, demo.title)

  if (!currentSession || currentSession.appName !== demo.name) {
    if (currentSession) updateSession(currentSession.id, now)
    const id = insertSession(demo.name, '', demo.title, now, date, classified.category, classified.color)
    currentSession = { id, appName: demo.name, windowTitle: demo.title, category: classified.category, color: classified.color, startTime: now }
    mainWindow?.webContents?.send('activity-changed', getCurrentActivity())
  } else if (now - currentSession.startTime > 30000) {
    updateSession(currentSession.id, now)
  }
}
