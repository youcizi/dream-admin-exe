/// <reference types="vite/client" />

interface Window {
  api: {
    wrangler: {
      run: (options: { cwd: string; args: string[]; env?: Record<string, string> }) => void
      stop: () => void
      sendInput: (input: string) => void
      onStdout: (callback: (data: string) => void) => void
      onStderr: (callback: (data: string) => void) => void
      onClose: (callback: (code: number | null) => void) => void
      onError: (callback: (err: string) => void) => void
      removeAllListeners: () => void
      scanProjects: (rootPath: string) => Promise<unknown[]>
      readConfig: (projectPath: string) => Promise<string>
      saveConfig: (projectPath: string, content: string) => Promise<boolean>
    }
    crawler: {
      crawl: (url: string) => Promise<unknown>
    }
    project: {
      openDirectory: () => Promise<string | null>
      downloadAndExtract: (url: string, baseDir: string) => Promise<string>
      exists: (path: string) => Promise<boolean>
      run: (options: { cwd: string; command: string; args: string[]; env?: Record<string, string> }) => void
      getMigrations: (projectPath: string) => Promise<string[]>
      readFile: (path: string) => Promise<string>
      onStdout: (callback: (data: string) => void) => void
      onStderr: (callback: (data: string) => void) => void
      onClose: (callback: (code: number) => void) => void
      onError: (callback: (err: string) => void) => void
      removeAllListeners: () => void
    },
    auth: {
      openLogin: (url: string) => Promise<string | null>
    }
    cloudflare: {
      verifyToken: (apiToken: string, accountId: string) => Promise<any>
      createResources: (apiToken: string, accountId: string, options: { d1Name: string; r2Name: string }) => Promise<{ d1Id: string; r2Name: string }>
      listResources: (apiToken: string, accountId: string) => Promise<{ d1: any[]; r2: any[]; pages: any[]; workers: any[] }>
      getPageDomains: (apiToken: string, accountId: string, projectName: string) => Promise<any[]>
      addPageDomain: (apiToken: string, accountId: string, projectName: string, domain: string) => Promise<any>
      deletePage: (apiToken: string, accountId: string, projectName: string) => Promise<any>
      getWorkerDomains: (apiToken: string, accountId: string) => Promise<any[]>
      addWorkerDomain: (apiToken: string, accountId: string, service: string, hostname: string, zoneId: string) => Promise<any>
      deleteWorker: (apiToken: string, accountId: string, scriptName: string) => Promise<any>
      getWorkerSubdomain: (apiToken: string, accountId: string) => Promise<string>
      deleteD1: (apiToken: string, accountId: string, databaseId: string) => Promise<any>
      createD1: (apiToken: string, accountId: string, name: string) => Promise<any>
      createR2: (apiToken: string, accountId: string, name: string) => Promise<any>
      deleteR2: (apiToken: string, accountId: string, bucketName: string) => Promise<any>
      getZones: (apiToken: string, accountId: string) => Promise<any[]>
      deletePageDomain: (apiToken: string, accountId: string, projectName: string, domainName: string) => Promise<any>
      deleteWorkerDomain: (apiToken: string, accountId: string, domainId: string) => Promise<any>
      getPageDetails: (apiToken: string, accountId: string, projectName: string) => Promise<{ subdomain?: string; [key: string]: any }>
      getWorkerBindings: (apiToken: string, accountId: string, scriptName: string) => Promise<Array<{ type: string; name: string; id?: string; [key: string]: any }>>
      createDNSRecord: (apiToken: string, zoneId: string, type: string, name: string, content: string, proxied?: boolean) => Promise<unknown>
      deleteDNSRecord: (apiToken: string, zoneId: string, recordId: string) => Promise<unknown>
      getDNSRecords: (apiToken: string, zoneId: string, domainName: string) => Promise<any[]>
      updateWorkerVar: (apiToken: string, accountId: string, scriptName: string, name: string, value: string) => Promise<unknown>
      queryD1: (apiToken: string, accountId: string, databaseId: string, sql: string) => Promise<any>
    }
    openExternal: (url: string) => Promise<void>
    openDeploy: () => void
  }
}
