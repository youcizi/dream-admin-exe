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
    openDeploy: () => void
  }
}
