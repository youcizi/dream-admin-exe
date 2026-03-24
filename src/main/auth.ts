import { BrowserWindow, ipcMain, session } from 'electron'

export function setupAuthHandlers(): void {
  ipcMain.handle('auth:open-login', async (_event, url: string) => {
    return new Promise((resolve, reject) => {
      const loginWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: '项目登录',
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      // Handle window close
      loginWindow.on('closed', () => {
        resolve(null)
      })

      // Monitor cookies
      const filter = { name: 'admin_token' }

      const checkCookies = async (): Promise<void> => {
        try {
          const cookies = await session.defaultSession.cookies.get(filter)
          const adminToken = cookies.find((c) => c.name === 'admin_token')
          if (adminToken) {
            const tokenValue = adminToken.value
            console.log('Successfully captured admin_token')
            loginWindow.close()
            resolve(tokenValue)
          }
        } catch (error) {
          console.error('Error checking cookies:', error)
        }
      }

      // Listen for cookie changes
      session.defaultSession.cookies.on('changed', (_event, cookie, _cause, removed) => {
        if (cookie.name === 'admin_token' && !removed) {
          console.log('admin_token cookie changed/added')
          checkCookies()
        }
      })

      // Also check periodically or on page load as a fallback
      loginWindow.webContents.on('did-finish-load', () => {
        checkCookies()
      })

      loginWindow.loadURL(url).catch((err) => {
        console.error('Failed to load login URL:', err)
        loginWindow.close()
        reject(err)
      })
    })
  })
}
