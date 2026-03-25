/// <reference types="vite/client" />

interface Window {
  api: {
    wrangler: any
    crawler: {
      crawl: (url: string) => Promise<any>
    }
    auth: {
      openLogin: (url: string) => Promise<string | null>
    }
    cloudflare: {
      verifyToken: (apiToken: string, accountId: string) => Promise<any>
    }
    openDeploy: () => void
  }
}
