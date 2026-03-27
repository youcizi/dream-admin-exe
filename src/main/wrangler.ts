import { spawn, ChildProcess } from 'node:child_process'
import { ipcMain, IpcMainEvent } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'

interface WranglerOptions {
  cwd: string
  args: string[]
  env?: Record<string, string>
}

interface ProjectInfo {
  path: string
  name: string
  config: string
}

export function setupWranglerHandlers(): void {
  let activeProcess: ChildProcess | null = null

  ipcMain.on('wrangler-run', (event: IpcMainEvent, options: WranglerOptions) => {
    if (activeProcess) {
      activeProcess.kill()
    }

    const { cwd, args, env } = options
    console.log(`Running: npx wrangler ${args.join(' ')} in ${cwd}`)

    // Debug logging for credentials
    if (env?.CLOUDFLARE_API_TOKEN) {
      const t = env.CLOUDFLARE_API_TOKEN;
      console.log(`[Wrangler] API Token: ${t.slice(0, 4)}...${t.slice(-4)} (Length: ${t.length})`);
    }
    if (env?.CLOUDFLARE_ACCOUNT_ID) {
      console.log(`[Wrangler] Account ID: ${env.CLOUDFLARE_ACCOUNT_ID}`);
    }

    // Use npx wrangler
    activeProcess = spawn('npx', ['wrangler', ...args], {
      cwd,
      shell: true,
      env: { ...process.env, ...env, FORCE_COLOR: '1' }
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

  ipcMain.handle('scan-projects', async (_event, rootPath: string): Promise<ProjectInfo[]> => {
    try {
      if (!fs.existsSync(rootPath)) return []

      const results: ProjectInfo[] = []
      const findWranglerToml = (dir: string, depth = 0): void => {
        if (depth > 3) return // Prevent too deep scanning

        const files = fs.readdirSync(dir)
        const hasWrangler = files.includes('wrangler.toml')
        const hasIndex = files.includes('index.js') || files.includes('src/index.js')

        if (hasWrangler || hasIndex) {
          const configPath = path.join(dir, 'wrangler.toml')
          let content = ''
          if (fs.existsSync(configPath)) {
            content = fs.readFileSync(configPath, 'utf-8')
          }
          
          const nameMatch = content.match(/^name\s*=\s*"(.*)"/m)
          results.push({
            path: dir,
            name: nameMatch ? nameMatch[1] : path.basename(dir),
            config: content
          })
          
          // If we found a project, don't recurse further in this branch
          return
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
      
      // If no project found but it's a valid directory, return the directory itself as a potential project
      if (results.length === 0 && fs.existsSync(rootPath)) {
        results.push({
          path: rootPath,
          name: path.basename(rootPath),
          config: ''
        })
      }
      
      return results
    } catch (error) {
      console.error('Scan projects error:', error)
      return []
    }
  })

  ipcMain.handle('wrangler:readConfig', async (_event, projectPath: string) => {
    const configPath = path.join(projectPath, 'wrangler.toml')
    if (fs.existsSync(configPath)) {
      return fs.readFileSync(configPath, 'utf-8')
    }
    return ''
  })

  ipcMain.handle('wrangler:saveConfig', async (_event, projectPath: string, content: string) => {
    const configPath = path.join(projectPath, 'wrangler.toml')
    fs.writeFileSync(configPath, content, 'utf-8')
    return true
  })
}
