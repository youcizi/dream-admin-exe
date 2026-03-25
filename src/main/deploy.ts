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

  ipcMain.handle(
    'cloudflare:createResources',
    async (
      _event,
      apiToken: string,
      accountId: string,
      resources: { d1Name: string; r2Name: string }
    ) => {
      const results = { d1Id: '', r2Name: resources.r2Name }

      try {
        // 1. D1 Database
        // Check if exists
        const d1ListResponse = await axios.get(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        )

        const existingD1 = d1ListResponse.data.result.find((db: any) => db.name === resources.d1Name)
        if (existingD1) {
          results.d1Id = existingD1.uuid
        } else {
          // Create new D1
          const d1CreateResponse = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
            { name: resources.d1Name },
            { headers: { Authorization: `Bearer ${apiToken}` } }
          )
          results.d1Id = d1CreateResponse.data.result.uuid
        }

        // 2. R2 Bucket
        // Check if exists
        const r2ListResponse = await axios.get(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        )

        const existingR2 = r2ListResponse.data.result.buckets.find(
          (b: any) => b.name === resources.r2Name
        )
        if (!existingR2) {
          // Create new R2
          await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
            { name: resources.r2Name },
            { headers: { Authorization: `Bearer ${apiToken}` } }
          )
        }

        return results
      } catch (error: any) {
        console.error('Create resources error:', error.response?.data || error.message)
        throw error
      }
    }
  )
}
