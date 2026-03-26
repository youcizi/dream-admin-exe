/// <reference types="vite/client" />

interface Window {
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
      saveConfig: (projectPath: string, content: string) => Promise<boolean>
    }
    crawler: {
      crawl: (url: string) => Promise<any>
    }
    project: {
      openDirectory: () => Promise<string | null>
      downloadAndExtract: (url: string, baseDir: string) => Promise<string>
    },
    auth: {
      openLogin: (url: string) => Promise<string | null>
    }
    cloudflare: {
      verifyToken: (apiToken: string, accountId: string) => Promise<any>
      createResources: (
        apiToken: string,
        accountId: string,
        resources: { d1Name: string; r2Name: string }
      ) => Promise<{ d1Id: string; r2Name: string }>
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
      createDNSRecord: (apiToken: string, zoneId: string, type: string, name: string, content: string, proxied?: boolean) => Promise<any>
      getDNSRecords: (apiToken: string, zoneId: string, domainName: string) => Promise<any[]>
    }
    openExternal: (url: string) => Promise<void>
    openDeploy: () => void
  }
}
