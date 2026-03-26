import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      wrangler: {
        run: (options: { cwd: string; args: string[] }) => void
        stop: () => void
        sendInput: (input: string) => void
        onStdout: (callback: (data: string) => void) => void
        onStderr: (callback: (data: string) => void) => void
        onClose: (callback: (code: number | null) => void) => void
        onError: (callback: (err: string) => void) => void
        scanProjects: (rootPath: string) => Promise<any[]>
        readConfig: (projectPath: string) => Promise<string>
        saveConfig: (projectPath: string, content: string) => Promise<void>
        removeAllListeners: () => void
      }
      project: {
        openDirectory: () => Promise<string>
        downloadAndExtract: (url: string, destDir: string) => Promise<string>
        saveFile: (content: string, defaultName: string) => Promise<string | null>
      }
      shell: {
        openExternal: (url: string) => Promise<void>
        openPath: (path: string) => Promise<void>
      }
      crawler: {
        crawl: (url: string) => Promise<any>
      }
      auth: {
        openLogin: (url: string) => Promise<any>
      }
      cloudflare: {
        verifyToken: (apiToken: string, accountId: string) => Promise<any>
        createResources: (apiToken: string, accountId: string, resources: any) => Promise<any>
        listResources: (apiToken: string, accountId: string) => Promise<any>
        getPageDomains: (apiToken: string, accountId: string, projectName: string) => Promise<any>
        addPageDomain: (apiToken: string, accountId: string, projectName: string, domain: string) => Promise<any>
        deletePage: (apiToken: string, accountId: string, projectName: string) => Promise<any>
        getWorkerDomains: (apiToken: string, accountId: string) => Promise<any>
        addWorkerDomain: (apiToken: string, accountId: string, service: string, hostname: string, zoneId: string) => Promise<any>
        deleteWorker: (apiToken: string, accountId: string, scriptName: string) => Promise<any>
        getWorkerSubdomain: (apiToken: string, accountId: string) => Promise<any>
        renameD1: (apiToken: string, accountId: string, databaseId: string, name: string) => Promise<any>
        deleteD1: (apiToken: string, accountId: string, databaseId: string) => Promise<any>
        createD1: (apiToken: string, accountId: string, name: string) => Promise<any>
        createR2: (apiToken: string, accountId: string, name: string) => Promise<any>
        deleteR2: (apiToken: string, accountId: string, bucketName: string) => Promise<any>
        getZones: (apiToken: string, accountId: string) => Promise<any>
        deletePageDomain: (apiToken: string, accountId: string, projectName: string, domainName: string) => Promise<any>
        deleteWorkerDomain: (apiToken: string, accountId: string, domainId: string) => Promise<any>
        createDNSRecord: (apiToken: string, zoneId: string, type: string, name: string, content: string, proxied?: boolean) => Promise<any>
        getDNSRecords: (apiToken: string, zoneId: string, domainName: string) => Promise<any>
        queryD1: (apiToken: string, accountId: string, databaseId: string, sql: string) => Promise<any>
        listR2Objects: (apiToken: string, accountId: string, bucketName: string, prefix?: string) => Promise<any>
        deleteR2Object: (apiToken: string, accountId: string, bucketName: string, key: string) => Promise<any>
        uploadR2Object: (apiToken: string, accountId: string, bucketName: string, key: string, filePath: string) => Promise<any>
        getWorkerBindings: (apiToken: string, accountId: string, scriptName: string) => Promise<any[]>
        updateWorkerVar: (apiToken: string, accountId: string, scriptName: string, name: string, value: string) => Promise<any>
      }
      openDeploy: () => void
    }
  }
}
