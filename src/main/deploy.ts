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
      width: 1044,
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

  ipcMain.handle('cloudflare:listResources', async (_event, apiToken, accountId) => {
    try {
      const headers = { Authorization: `Bearer ${apiToken}` }
      const [d1Res, r2Res, pagesRes, workersRes] = await Promise.all([
        axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`, {
          headers
        }),
        axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`, {
          headers
        }),
        axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`, {
          headers
        }),
        axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
          headers
        })
      ])

      return {
        d1: d1Res.data.result || [],
        r2: r2Res.data.result?.buckets || [],
        pages: pagesRes.data.result || [],
        workers: workersRes.data.result || []
      }
    } catch (error: any) {
      console.error('List resources error:', error.response?.data || error.message)
      throw error
    }
  })

  // Pages Domain Management
  ipcMain.handle(
    'cloudflare:getPageDomains',
    async (_event, apiToken, accountId, projectName) => {
      const res = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data.result
    }
  )

  ipcMain.handle(
    'cloudflare:addPageDomain',
    async (_event, apiToken, accountId, projectName, domain) => {
      const res = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
        { name: domain },
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  ipcMain.handle(
    'cloudflare:deletePage',
    async (_event, apiToken, accountId, projectName) => {
      const res = await axios.delete(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  // Workers Domain Management
  ipcMain.handle('cloudflare:getWorkerDomains', async (_event, apiToken, accountId) => {
    const res = await axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/domains`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    return res.data.result
  })

  ipcMain.handle('cloudflare:getWorkerSubdomain', async (_event, apiToken, accountId) => {
    const res = await axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    return res.data.result?.subdomain || ''
  })

  ipcMain.handle(
    'cloudflare:addWorkerDomain',
    async (_event, apiToken, accountId, service, hostname, zoneId) => {
      const res = await axios.put(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/domains`,
        {
          environment: 'production',
          hostname,
          service,
          zone_id: zoneId
        },
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  ipcMain.handle(
    'cloudflare:deleteWorker',
    async (_event, apiToken, accountId, scriptName) => {
      const res = await axios.delete(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  // D1 & R2 Management
  ipcMain.handle(
    'cloudflare:renameD1',
    async (_event, apiToken, accountId, databaseId, name) => {
      const res = await axios.patch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`,
        { name },
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  ipcMain.handle('cloudflare:deleteD1', async (_event, apiToken, accountId, databaseId) => {
    const res = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
    return res.data
  })

  ipcMain.handle('cloudflare:createD1', async (_event, apiToken, accountId, name) => {
    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`,
      { name },
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
    return res.data
  })

  ipcMain.handle('cloudflare:createR2', async (_event, apiToken, accountId, name) => {
    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
      { name },
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
    return res.data
  })

  ipcMain.handle('cloudflare:deleteR2', async (_event, apiToken, accountId, bucketName) => {
    const res = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
    return res.data
  })

  ipcMain.handle('cloudflare:getZones', async (_event, apiToken, accountId) => {
    const res = await axios.get(`https://api.cloudflare.com/client/v4/zones`, {
      params: { 'account.id': accountId },
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    return res.data.result
  })

  ipcMain.handle(
    'cloudflare:deletePageDomain',
    async (_event, apiToken, accountId, projectName, domainName) => {
      const res = await axios.delete(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domainName}`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  ipcMain.handle('cloudflare:deleteWorkerDomain', async (_event, apiToken, accountId, domainId) => {
    const res = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/domains/${domainId}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
    return res.data
  })

  ipcMain.handle(
    'cloudflare:createDNSRecord',
    async (_event, apiToken, zoneId, type, name, content, proxied = true) => {
      const res = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        { type, name, content, proxied },
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      return res.data
    }
  )

  ipcMain.handle(
    'cloudflare:getDNSRecords',
    async (_event, apiToken, zoneId, domainName) => {
      const res = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        { 
          params: { name: domainName },
          headers: { Authorization: `Bearer ${apiToken}` } 
        }
      )
      return res.data.result
    }
  )
}
