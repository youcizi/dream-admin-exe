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
      }
      crawler: {
        crawl: (url: string) => Promise<any>
      }
    }
  }
}
