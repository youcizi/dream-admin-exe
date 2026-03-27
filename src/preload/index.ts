import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  wrangler: {
    run: (options: { cwd: string; args: string[] }) =>
      electronAPI.ipcRenderer.send('wrangler-run', options),
    stop: () => electronAPI.ipcRenderer.send('wrangler-stop'),
    sendInput: (input: string) => electronAPI.ipcRenderer.send('wrangler-input', input),
    onStdout: (callback: (data: string) => void) =>
      electronAPI.ipcRenderer.on('wrangler-stdout', (_event, data) => callback(data)),
    onStderr: (callback: (data: string) => void) =>
      electronAPI.ipcRenderer.on('wrangler-stderr', (_event, data) => callback(data)),
    onClose: (callback: (code: number | null) => void) =>
      electronAPI.ipcRenderer.on('wrangler-close', (_event, code) => callback(code)),
    onError: (callback: (err: string) => void) =>
      electronAPI.ipcRenderer.on('wrangler-error', (_event, err) => callback(err)),
    scanProjects: (rootPath: string) => electronAPI.ipcRenderer.invoke('scan-projects', rootPath),
    readConfig: (projectPath: string) =>
      electronAPI.ipcRenderer.invoke('wrangler:readConfig', projectPath),
    saveConfig: (projectPath: string, content: string) =>
      electronAPI.ipcRenderer.invoke('wrangler:saveConfig', projectPath, content),
    removeAllListeners: () => {
      electronAPI.ipcRenderer.removeAllListeners('wrangler-stdout')
      electronAPI.ipcRenderer.removeAllListeners('wrangler-stderr')
      electronAPI.ipcRenderer.removeAllListeners('wrangler-close')
      electronAPI.ipcRenderer.removeAllListeners('wrangler-error')
    }
  },
  project: {
    openDirectory: () => electronAPI.ipcRenderer.invoke('dialog:openDirectory'),
    downloadAndExtract: (url: string, destDir: string) =>
      electronAPI.ipcRenderer.invoke('project:downloadAndExtract', url, destDir),
    saveFile: (content: string, defaultName: string) =>
      electronAPI.ipcRenderer.invoke('project:saveFile', content, defaultName),
    exists: (path: string) => electronAPI.ipcRenderer.invoke('project:exists', path),
    run: (options: { cwd: string; command: string; args: string[]; env?: Record<string, string> }) => electronAPI.ipcRenderer.send('project:run', options),
    onStdout: (callback: (data: string) => void) => {
      electronAPI.ipcRenderer.on('project:stdout', (_event, data) => callback(data))
    },
    onStderr: (callback: (data: string) => void) => {
      electronAPI.ipcRenderer.on('project:stderr', (_event, data) => callback(data))
    },
    onClose: (callback: (code: number) => void) => {
      electronAPI.ipcRenderer.on('project:close', (_event, code) => callback(code))
    },
    onError: (callback: (err: string) => void) => {
      electronAPI.ipcRenderer.on('project:error', (_event, err) => callback(err))
    },
    removeAllListeners: () => {
      electronAPI.ipcRenderer.removeAllListeners('project:stdout')
      electronAPI.ipcRenderer.removeAllListeners('project:stderr')
      electronAPI.ipcRenderer.removeAllListeners('project:close')
      electronAPI.ipcRenderer.removeAllListeners('project:error')
    }
  },
  shell: {
    openExternal: (url: string) => electronAPI.ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path: string) => electronAPI.ipcRenderer.invoke('shell:openPath', path)
  },
  crawler: {
    crawl: (url: string) => electronAPI.ipcRenderer.invoke('crawl-url', url)
  },
  auth: {
    openLogin: (url: string) => electronAPI.ipcRenderer.invoke('auth:open-login', url)
  },
  cloudflare: {
    verifyToken: (apiToken: string, accountId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:verifyToken', apiToken, accountId),
    createResources: (apiToken: string, accountId: string, resources: any) =>
      electronAPI.ipcRenderer.invoke('cloudflare:createResources', apiToken, accountId, resources),
    listResources: (apiToken: string, accountId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:listResources', apiToken, accountId),
    getPageDomains: (apiToken: string, accountId: string, projectName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getPageDomains', apiToken, accountId, projectName),
    addPageDomain: (apiToken: string, accountId: string, projectName: string, domain: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:addPageDomain', apiToken, accountId, projectName, domain),
    deletePage: (apiToken: string, accountId: string, projectName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deletePage', apiToken, accountId, projectName),
    getPageDetails: (apiToken: string, accountId: string, projectName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getPageDetails', apiToken, accountId, projectName),
    getWorkerDomains: (apiToken: string, accountId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getWorkerDomains', apiToken, accountId),
    addWorkerDomain: (apiToken: string, accountId: string, service: string, hostname: string, zoneId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:addWorkerDomain', apiToken, accountId, service, hostname, zoneId),
    deleteWorker: (apiToken: string, accountId: string, scriptName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deleteWorker', apiToken, accountId, scriptName),
    getWorkerSubdomain: (apiToken: string, accountId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getWorkerSubdomain', apiToken, accountId),
    renameD1: (apiToken: string, accountId: string, databaseId: string, name: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:renameD1', apiToken, accountId, databaseId, name),
    deleteD1: (apiToken: string, accountId: string, databaseId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deleteD1', apiToken, accountId, databaseId),
    createD1: (apiToken: string, accountId: string, name: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:createD1', apiToken, accountId, name),
    createR2: (apiToken: string, accountId: string, name: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:createR2', apiToken, accountId, name),
    deleteR2: (apiToken: string, accountId: string, bucketName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deleteR2', apiToken, accountId, bucketName),
    getZones: (apiToken: string, accountId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getZones', apiToken, accountId),
    deletePageDomain: (apiToken: string, accountId: string, projectName: string, domainName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deletePageDomain', apiToken, accountId, projectName, domainName),
    deleteWorkerDomain: (apiToken: string, accountId: string, domainId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deleteWorkerDomain', apiToken, accountId, domainId),
    createDNSRecord: (apiToken: string, zoneId: string, type: string, name: string, content: string, proxied?: boolean) =>
      electronAPI.ipcRenderer.invoke('cloudflare:createDNSRecord', apiToken, zoneId, type, name, content, proxied),
    getDNSRecords: (apiToken: string, zoneId: string, domainName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getDNSRecords', apiToken, zoneId, domainName),
    deleteDNSRecord: (apiToken: string, zoneId: string, recordId: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deleteDNSRecord', apiToken, zoneId, recordId),
    queryD1: (apiToken: string, accountId: string, databaseId: string, sql: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:queryD1', apiToken, accountId, databaseId, sql),
    listR2Objects: (apiToken: string, accountId: string, bucketName: string, prefix?: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:listR2Objects', apiToken, accountId, bucketName, prefix),
    deleteR2Object: (apiToken: string, accountId: string, bucketName: string, key: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:deleteR2Object', apiToken, accountId, bucketName, key),
    uploadR2Object: (apiToken: string, accountId: string, bucketName: string, key: string, filePath: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:uploadR2Object', apiToken, accountId, bucketName, key, filePath),
    getWorkerBindings: (apiToken: string, accountId: string, scriptName: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:getWorkerBindings', apiToken, accountId, scriptName),
    updateWorkerVar: (apiToken: string, accountId: string, scriptName: string, name: string, value: string) =>
      electronAPI.ipcRenderer.invoke('cloudflare:updateWorkerVar', apiToken, accountId, scriptName, name, value)
  },
  openExternal: (url: string) => electronAPI.ipcRenderer.invoke('shell:openExternal', url),
  openDeploy: () => electronAPI.ipcRenderer.send('window:open-deploy')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
