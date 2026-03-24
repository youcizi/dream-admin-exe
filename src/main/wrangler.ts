import { spawn, ChildProcess } from 'node:child_process'
import { ipcMain, IpcMainEvent } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'

interface WranglerOptions {
  cwd: string
  args: string[]
}

export function setupWranglerHandlers() {
  let activeProcess: ChildProcess | null = null

  ipcMain.on('wrangler-run', (event: IpcMainEvent, options: WranglerOptions) => {
    if (activeProcess) {
      activeProcess.kill()
    }

    const { cwd, args } = options
    console.log(`Running: npx wrangler ${args.join(' ')} in ${cwd}`)

    // Use npx wrangler
    activeProcess = spawn('npx', ['wrangler', ...args], {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    })

    activeProcess.stdout?.on('data', (data) => {
      event.reply('wrangler-stdout', data.toString())
    })

    activeProcess.stderr?.on('data', (data) => {
      event.reply('wrangler-stderr', data.toString())
    })

    activeProcess.on('close', (code) => {
      event.reply('wrangler-close', code)
      activeProcess = null
    })

    activeProcess.on('error', (err) => {
      event.reply('wrangler-error', err.message)
      activeProcess = null
    })
  })

  ipcMain.on('wrangler-stop', () => {
    if (activeProcess) {
      activeProcess.kill()
      activeProcess = null
    }
  })

  ipcMain.on('wrangler-input', (_event, input: string) => {
    if (activeProcess && activeProcess.stdin) {
      activeProcess.stdin.write(input)
    }
  })

  ipcMain.handle('scan-projects', async (_event, rootPath: string) => {
    try {
      if (!fs.existsSync(rootPath)) return []

      const results: any[] = []
      const findWranglerToml = (dir: string, depth = 0) => {
        if (depth > 3) return // Prevent too deep scanning

        const files = fs.readdirSync(dir)
        if (files.includes('wrangler.toml')) {
          const configPath = path.join(dir, 'wrangler.toml')
          const content = fs.readFileSync(configPath, 'utf-8')
          // Simple regex parsing for wrangler.toml
          const nameMatch = content.match(/^name\s*=\s*"(.*)"/m)
          results.push({
            path: dir,
            name: nameMatch ? nameMatch[1] : path.basename(dir),
            config: content
          })
        }

        for (const file of files) {
          const fullPath = path.join(dir, file)
          if (
            fs.statSync(fullPath).isDirectory() &&
            !file.startsWith('.') &&
            file !== 'node_modules'
          ) {
            findWranglerToml(fullPath, depth + 1)
          }
        }
      }

      findWranglerToml(rootPath)
      return results
    } catch (error) {
      console.error('Scan projects error:', error)
      return []
    }
  })
}
