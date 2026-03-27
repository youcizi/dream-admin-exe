import { app, shell, BrowserWindow, ipcMain, dialog, IpcMainEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { setupWranglerHandlers } from './wrangler'
import { setupCrawlerHandlers } from './crawler'
import { setupAuthHandlers } from './auth'
import { setupDeployHandlers } from './deploy'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { exec, spawn } from 'node:child_process'
import axios from 'axios'
import { promisify } from 'node:util'

const execPromise = promisify(exec)

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Setup custom handlers
  setupWranglerHandlers()
  setupCrawlerHandlers()
  setupAuthHandlers()
  setupDeployHandlers()

  // Project Management Handlers
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) return null
    return filePaths[0]
  })

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('project:saveFile', async (_event, content: string, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'SQL Files', extensions: ['sql'] }, { name: 'All Files', extensions: ['*'] }]
    })
    if (canceled || !filePath) return null
    fs.writeFileSync(filePath, content, 'utf8')
    return filePath
  })

  ipcMain.handle('shell:openPath', async (_event, path: string) => {
    await shell.openPath(path)
  })

  ipcMain.handle('project:downloadAndExtract', async (_event, url: string, destDir: string) => {
    try {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      const zipPath = path.join(destDir, 'project_bundle.zip')
      console.log(`Downloading ${url} to ${zipPath}`)

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
      })

      fs.writeFileSync(zipPath, response.data)
      console.log('Download complete, extracting...')

      // Windows Expand-Archive via PowerShell
      const psCommand = `PowerShell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`
      await execPromise(psCommand)

      // Clean up zip
      fs.unlinkSync(zipPath)

      // Find the inner directory (GitHub zip usually has a root folder like repo-name-branch)
      const contents = fs.readdirSync(destDir)
      const extractedDir = contents.find((f) => fs.statSync(path.join(destDir, f)).isDirectory())

      return extractedDir ? path.join(destDir, extractedDir) : destDir
    } catch (error: unknown) {
      console.error('Download/Extract error:', error)
      throw error
    }
  })

  ipcMain.handle('project:exists', async (_event, filePath: string) => {
    return fs.existsSync(filePath)
  })

  ipcMain.on('project:run', (event: IpcMainEvent, options: { cwd: string; command: string; args: string[]; env?: Record<string, string> }) => {
    const { cwd, command, args, env } = options

    // Debug logging for credentials
    if (env?.CLOUDFLARE_API_TOKEN) {
      const t = env.CLOUDFLARE_API_TOKEN;
      console.log(`[Project] API Token: ${t.slice(0, 4)}...${t.slice(-4)} (Length: ${t.length})`);
    }
    if (env?.CLOUDFLARE_ACCOUNT_ID) {
      console.log(`[Project] Account ID: ${env.CLOUDFLARE_ACCOUNT_ID}`);
    }

    const child = spawn(command, args, {
      cwd,
      shell: true,
      env: { ...process.env, ...env, FORCE_COLOR: '1' }
    })

    child.stdout?.on('data', (data) => event.reply('project:stdout', data.toString()))
    child.stderr?.on('data', (data) => event.reply('project:stderr', data.toString()))
    child.on('close', (code) => event.reply('project:close', code))
    child.on('error', (err) => event.reply('project:error', err.message))
  })

  createWindow()


  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
