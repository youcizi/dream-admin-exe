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
    }
    openDeploy: () => void
  }
}
