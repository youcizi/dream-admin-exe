import { BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import axios from 'axios'

export function setupDeployHandlers(): void {
  let deployWindow: BrowserWindow | null = null

  ipcMain.on('window:open-deploy', () => {
    if (deployWindow) {
      deployWindow.focus()
      return
    }

    deployWindow = new BrowserWindow({
      width: 1000,
      height: 750,
      title: '应用部署管理',
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      deployWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/deploy.html`)
    } else {
      deployWindow.loadFile(join(__dirname, '../renderer/deploy.html'))
    }

    deployWindow.on('closed', () => {
      deployWindow = null
    })
  })

  ipcMain.handle('cloudflare:verifyToken', async (_event, apiToken: string, accountId: string) => {
    try {
      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error: any) {
      if (error.response) {
        return error.response.data
      }
      throw error
    }
  })
}
