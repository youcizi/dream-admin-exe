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
      electronAPI.ipcRenderer.invoke('wrangler:saveConfig', projectPath, content)
  },
  project: {
    openDirectory: () => electronAPI.ipcRenderer.invoke('dialog:openDirectory'),
    downloadAndExtract: (url: string, destDir: string) =>
      electronAPI.ipcRenderer.invoke('project:downloadAndExtract', url, destDir)
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
      electronAPI.ipcRenderer.invoke('cloudflare:createResources', apiToken, accountId, resources)
  },
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
