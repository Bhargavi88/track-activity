import { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { startTracking, stopTracking, setMainWindow } from './tracker'
import { registerIpcHandlers } from './ipc-handlers'
import { getCategories } from './db'
import { setCustomCategory } from './tracker'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    backgroundColor: '#0d0f14',
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  setMainWindow(mainWindow)
}

function createTray(): void {
  // Use a simple colored rectangle as tray icon
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Track Activity',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray?.destroy()
        stopTracking()
        app.exit(0)
      }
    }
  ])

  tray.setToolTip('Track Activity')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.trackactivity.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Load custom categories
  const savedCategories = getCategories()
  for (const cat of savedCategories) {
    setCustomCategory(cat.appName, cat.category, cat.color)
  }

  registerIpcHandlers()
  createWindow()
  createTray()
  startTracking()

  app.on('activate', () => {
    mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit on Windows when all windows closed (keep in tray)
  }
})

app.on('before-quit', () => {
  stopTracking()
})
