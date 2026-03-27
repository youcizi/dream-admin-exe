import React, { useState, useRef } from 'react'
import {
  FolderOpen,
  Github,
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react'

interface ProjectInfo {
  path: string
  name: string
  config: string
}

interface WorkerService {
  id: string
  name: string
  modified_on: string
  domains: { name: string; id: string }[]
  subdomain?: string
}

interface D1Database {
  uuid: string
  name: string
  created_at?: string
}

interface R2Bucket {
  name: string
  creation_date?: string
}

interface D1Binding {
  type: 'd1'
  name: string
  database_id: string
  database_name: string
}

interface R2Binding {
  type: 'r2'
  name: string
  bucket_name: string
}

interface DeployProcessProps {
  onBack: (tab?: string) => void
  type: 'frontend' | 'backend'
  isUpdate?: boolean
  updateTarget?: WorkerService | null
}

const DeployProcess: React.FC<DeployProcessProps> = ({ onBack, type, isUpdate, updateTarget }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchingConfig, setFetchingConfig] = useState(false)
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [error, setError] = useState('')
  const [configFields, setConfigFields] = useState({
    name: '',
    database_name: '',
    database_id: '',
    bucket_name: '',
    CF_ADMIN_CAPTCHA: '',
    JWT_SECRET: '',
    CF_ACCOUNT_ID: '',
    CF_API_TOKEN: ''
  })
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [deployStatus, setDeployStatus] = useState<'idle' | 'running' | 'success' | 'failure'>('idle')
  const [deployedUrl, setDeployedUrl] = useState('')
  const [existingResources, setExistingResources] = useState<{ d1: D1Database[]; r2: R2Bucket[] }>({
    d1: [],
    r2: []
  })
  const [detectedMigrations, setDetectedMigrations] = useState<string[]>([])

  const HELP_URL = 'https://soft.ycz.me/help'

  React.useEffect(() => {
    if (step === 2 && configFields.CF_API_TOKEN && configFields.CF_ACCOUNT_ID) {
      window.api.cloudflare
        .listResources(configFields.CF_API_TOKEN, configFields.CF_ACCOUNT_ID)
        .then(setExistingResources)
        .catch(console.error)
    }
  }, [step, configFields.CF_API_TOKEN, configFields.CF_ACCOUNT_ID])

  const isD1NameConflict = existingResources.d1.some((db) => db.name === configFields.database_name)
  const isR2NameConflict = existingResources.r2.some((b) => b.name === configFields.bucket_name)

  const consoleRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [deployLogs])

  const runProjectCommand = (command: string, args: string[]): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      window.api.project.removeAllListeners()
      window.api.project.onStdout((data) => setDeployLogs((prev) => [...prev, data]))
      window.api.project.onStderr((data) => setDeployLogs((prev) => [...prev, `[ERR] ${data}`]))
      window.api.project.onClose((code) => {
        window.api.project.removeAllListeners()
        if (code === 0) resolve()
        else reject(new Error(`命令执行失败: ${command} ${args.join(' ')}, 退出码: ${code}`))
      })
      window.api.project.onError((err) => reject(new Error(err)))
      window.api.project.run({
        cwd: projectInfo!.path,
        command,
        args,
        env: {
          CLOUDFLARE_API_TOKEN: configFields.CF_API_TOKEN.trim(),
          CF_API_TOKEN: configFields.CF_API_TOKEN.trim(),
          CLOUDFLARE_ACCOUNT_ID: configFields.CF_ACCOUNT_ID.trim(),
          CF_ACCOUNT_ID: configFields.CF_ACCOUNT_ID.trim()
        }
      })
    })
  }

  const runWranglerCommand = (args: string[]): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      window.api.wrangler.removeAllListeners()
      window.api.wrangler.onStdout((data) => {
        setDeployLogs((prev) => [...prev, data])
        const urlMatch = data.match(/https:\/\/[a-zA-Z0-9.-]+\.(pages\.dev|workers\.dev)/)
        if (urlMatch) {
          setDeployedUrl(urlMatch[0])
        }
      })
      window.api.wrangler.onStderr((data) => setDeployLogs((prev) => [...prev, `[ERR] ${data}`]))
      window.api.wrangler.onClose((code) => {
        window.api.wrangler.removeAllListeners()
        if (code === 0) resolve()
        else reject(new Error(`Wrangler 命令执行失败, 退出码: ${code}`))
      })
      window.api.wrangler.onError((err) => reject(new Error(err)))
      window.api.wrangler.run({
        cwd: projectInfo!.path,
        args,
        env: {
          CLOUDFLARE_API_TOKEN: configFields.CF_API_TOKEN.trim(),
          CF_API_TOKEN: configFields.CF_API_TOKEN.trim(),
          CLOUDFLARE_ACCOUNT_ID: configFields.CF_ACCOUNT_ID.trim(),
          CF_ACCOUNT_ID: configFields.CF_ACCOUNT_ID.trim()
        }
      })
    })
  }

  const handleStartDeploy = async (): Promise<void> => {
    if (!projectInfo) return

    if (!configFields.database_name || !configFields.bucket_name) {
      setError('请完整填写数据库和存储桶名称')
      return
    }

    if (!configFields.CF_API_TOKEN.trim() || !configFields.CF_ACCOUNT_ID.trim()) {
      setError('请先在第一步中点击“立即配置”，填写完整的 Cloudflare Token 和 Account ID')
      return
    }

    try {
      setDeployStatus('running')
      setStep(3)
      setDeployLogs(['🚀 启动部署流程...'])

      if (!isUpdate) {
        // 1. Initial configuration update
        setDeployLogs((prev) => [...prev, '正在初始化 wrangler.toml 配置文件...'])
        const initialToml = `name = "${configFields.name}"
main = "index.js"
compatibility_date = "2024-03-25"
minify = true
account_id = "${configFields.CF_ACCOUNT_ID.trim()}"

[[d1_databases]]
binding = "DB"
database_name = "${configFields.database_name}"
database_id = "${configFields.database_id || ''}"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "${configFields.bucket_name}"

[vars]
CF_ACCOUNT_ID = "${configFields.CF_ACCOUNT_ID.trim()}"
CF_API_TOKEN = "${configFields.CF_API_TOKEN.trim()}"
CF_ADMIN_CAPTCHA = "${configFields.CF_ADMIN_CAPTCHA}"
JWT_SECRET = "${configFields.JWT_SECRET}"
`
        await window.api.wrangler.saveConfig(projectInfo.path, initialToml)
        setDeployLogs((prev) => [...prev, 'wrangler.toml 已进行初步初始化'])

        // 2. Create/Verify Cloudflare Resources
        setDeployLogs((prev) => [...prev, '⚙️ 正在创建 Cloudflare 资源...'])
        const resources = await window.api.cloudflare.createResources(
          configFields.CF_API_TOKEN.trim(),
          configFields.CF_ACCOUNT_ID.trim(),
          {
            d1Name: configFields.database_name,
            r2Name: configFields.bucket_name
          }
        )
        setDeployLogs((prev) => [...prev, `Cloudflare 资源就绪: D1 ID = ${resources.d1Id}`])

        // 3. Final configuration update with database_id
        setDeployLogs((prev) => [...prev, '正在回填数据库 ID 并更新配置文件...'])
        const finalToml = initialToml.replace(/database_id\s*=\s*".*"/, `database_id = "${resources.d1Id}"`)
        await window.api.wrangler.saveConfig(projectInfo.path, finalToml)
        setDeployLogs((prev) => [...prev, 'wrangler.toml 配置已完全重构'])
      } else {
        // Update mode: Overwrite wrangler.toml with current project info
        setDeployLogs((prev) => [...prev, '正在更新部署配置 (基于现有资源)...'])
        const updateToml = `name = "${configFields.name}"
main = "index.js"
compatibility_date = "2024-03-25"
minify = true
account_id = "${configFields.CF_ACCOUNT_ID.trim()}"

[[d1_databases]]
binding = "DB"
database_name = "${configFields.database_name}"
database_id = "${configFields.database_id}"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "${configFields.bucket_name}"

[vars]
CF_ACCOUNT_ID = "${configFields.CF_ACCOUNT_ID.trim()}"
CF_API_TOKEN = "${configFields.CF_API_TOKEN.trim()}"
CF_ADMIN_CAPTCHA = "${configFields.CF_ADMIN_CAPTCHA}"
JWT_SECRET = "${configFields.JWT_SECRET}"
`
        await window.api.wrangler.saveConfig(projectInfo.path, updateToml)
        setDeployLogs((prev) => [...prev, 'wrangler.toml 配置已针对更新模式完成重写'])
      }

      // 4. Run Build Command (using project run for npm)
      setDeployLogs((prev) => [...prev, '正在执行项目构建命令 (npm run build)...'])
      try {
        await runProjectCommand('npm', ['run', 'build'])
        setDeployLogs((prev) => [...prev, '[SUCCESS] 项目构建完成'])
      } catch (bErr: any) {
        setDeployLogs((prev) => [...prev, `[INFO] 构建命令跳过或失败 (可能已是打包好的项目): ${bErr.message || String(bErr)}`])
      }

      // 5. Deploy Code
      setDeployLogs((prev) => [...prev, '正在启动部署命令: wrangler deploy...'])
      await runWranglerCommand(['deploy'])
      setDeployLogs((prev) => [...prev, '[SUCCESS] 代码部署成功！'])

      if (!isUpdate) {
        // 6. DB Initialization (schema.sql)
        const schemaPath = `${projectInfo.path}/schema.sql`
        const hasSchema = await window.api.project.exists(schemaPath)
        if (hasSchema) {
          setDeployLogs((prev) => [...prev, '正在初始化数据库环境 (schema.sql)...'])
          await runWranglerCommand(['d1', 'execute', 'DB', '--file=schema.sql', '--remote', '-y'])
          setDeployLogs((prev) => [...prev, '[SUCCESS] 数据库初始化完成'])
        } else {
          setDeployLogs((prev) => [...prev, '[INFO] 未检测到 schema.sql，跳过初始化步骤'])
        }
      }

      // 7. Check and Run Migrations
      const migrations = await window.api.project.getMigrations(projectInfo.path)
      if (migrations && migrations.length > 0) {
        setDeployLogs((prev) => [...prev, '检测到迁移文件，正在执行数据库迁移...'])
        await runWranglerCommand(['d1', 'migrations', 'apply', 'DB', '--remote', '-y'])
        setDeployLogs((prev) => [...prev, '[SUCCESS] 数据库迁移完成'])
      }

      setDeployStatus('success')
      setDeployLogs((prev) => [...prev, '🎉 部署完全成功！所有步骤已完成。'])

      // Save History
      const history = JSON.parse(localStorage.getItem('deploy_history') || '[]')
      const newEntry = {
        name: configFields.name,
        type: type,
        url: deployedUrl,
        d1Id: configFields.database_id,
        d1Name: configFields.database_name,
        r2Name: configFields.bucket_name,
        timestamp: Date.now()
      }
      localStorage.setItem('deploy_history', JSON.stringify([newEntry, ...history]))

    } catch (err: any) {
      setDeployLogs((prev) => [
        ...prev,
        `[异常] ${err.message || String(err)}`,
        `请访问帮助中心查看配置指南: ${HELP_URL}`
      ])
      setDeployStatus('failure')
    }
  }

  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSelectLocal = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const path = await window.api.project.openDirectory()
      if (!path) {
        setLoading(false)
        return
      }

      const projects = (await window.api.wrangler.scanProjects(path)) as ProjectInfo[]
      if (projects && projects.length > 0) {
        setProjectInfo(projects[0])
        // Initialize config fields
        await parseExistingConfig(projects[0].path, projects[0].config)
        
        // Scan for migrations
        const migrations = await window.api.project.getMigrations(projects[0].path)
        setDetectedMigrations(migrations)
        
        setStep(2)
      } else {
        setError('在选中目录中未找到相关的项目文件夹')
      }
    } catch (err: any) {
      setError(`选择文件夹失败: ${err?.message || String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchRemote = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const remoteUrl = isUpdate ? 'https://soft.ycz.me/download/updata.zip' : 'https://soft.ycz.me/dreamadmin/dist.zip'

      const baseDir = await window.api.project.openDirectory()
      if (!baseDir) {
        setLoading(false)
        return
      }

      const projectPath = await window.api.project.downloadAndExtract(remoteUrl, baseDir)
      const projects = (await window.api.wrangler.scanProjects(projectPath)) as ProjectInfo[]

      if (projects && projects.length > 0) {
        setProjectInfo(projects[0])
        await parseExistingConfig(projects[0].path, projects[0].config)
        
        // Scan for migrations
        const migrations = await window.api.project.getMigrations(projects[0].path)
        setDetectedMigrations(migrations)
        
        setStep(2)
      } else {
        setError('下载的项目无效')
      }
    } catch (err: any) {
      setError(`下载远端项目失败: ${err?.message || String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const parseExistingConfig = async (_projectPath: string, content: string): Promise<void> => {
    // Get stored Cloudflare config
    const savedConfig = localStorage.getItem('cloudflare_config')
    const cloudflareConfig = savedConfig ? JSON.parse(savedConfig) : {}

    // First, Parse all fields from wrangler.toml as BASE
    const baseFields = {
      name: content.match(/^name\s*=\s*"(.*)"/m)?.[1] || 'dream-admin',
      database_name: content.match(/database_name\s*=\s*"(.*)"/m)?.[1] || 'dream-db',
      database_id: content.match(/database_id\s*=\s*"(.*)"/m)?.[1] || '',
      bucket_name: content.match(/bucket_name\s*=\s*"(.*)"/m)?.[1] || 'dream-assets',
      CF_ADMIN_CAPTCHA: content.match(/CF_ADMIN_CAPTCHA\s*=\s*"(.*)"/m)?.[1] || generateRandomString(12),
      JWT_SECRET: content.match(/JWT_SECRET\s*=\s*"(.*)"/m)?.[1] || generateRandomString(32),
      CF_ACCOUNT_ID: cloudflareConfig.accountId || '',
      CF_API_TOKEN: cloudflareConfig.apiToken || ''
    }

    if (isUpdate && updateTarget) {
      setFetchingConfig(true)
      // For update, the name is fixed to the target script name
      const scriptName = updateTarget.name || (updateTarget as any).id
      try {
        const bindings = await window.api.cloudflare.getWorkerBindings(
          cloudflareConfig.apiToken,
          cloudflareConfig.accountId,
          scriptName
        )

        const d1Binding = bindings.find((b: any) => b.type === 'd1') as D1Binding | undefined
        const r2Binding = bindings.find((b: any) => b.type === 'r2') as R2Binding | undefined

        const fields = {
          ...baseFields,
          name: scriptName, // Priority: updateTarget name
          database_name: d1Binding?.database_name || baseFields.database_name,
          database_id: d1Binding?.database_id || baseFields.database_id,
          bucket_name: r2Binding?.bucket_name || baseFields.bucket_name
        }
        setConfigFields(fields)
      } catch (e) {
        console.error('Failed to fetch bindings for update:', e)
        // Fallback partially but keep name
        setConfigFields({
          ...baseFields,
          name: scriptName
        })
      } finally {
        setFetchingConfig(false)
      }
    } else {
      // Normal deployment, just use base fields
      setConfigFields(baseFields)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-700 max-w-5xl mx-auto w-full px-6 py-6 min-h-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onBack(type === 'frontend' ? 'frontend' : 'backend')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:text-slate-900 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              部署{type === 'frontend' ? '前端应用' : '管理后台'}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Cloudflare {type === 'frontend' ? 'Pages' : 'Workers'} Deployment Pipeline
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 shadow-lg ${step === s
                  ? 'bg-primary text-white scale-110 shadow-primary/30 ring-4 ring-primary/10'
                  : step > s
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-slate-100 text-slate-400'
                  }`}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-0.5 rounded-full transition-colors duration-500 ${step > s ? 'bg-emerald-500' : 'bg-slate-100'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">第一步：添加项目</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              您可以选择现有的本地项目文件夹，或者从我们的 Git 仓库中拉取最新的精简版工程代码。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Local Folder Card */}
            <button
              onClick={handleSelectLocal}
              disabled={loading}
              className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-primary/30 hover:-translate-y-2 transition-all text-left relative overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-500 mb-8 shadow-inner">
                  <FolderOpen size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">本地项目文件夹</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                  选择已有的文件夹，程序将自动扫描其中的 <code>wrangler.toml</code> 配置文件。
                </p>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  立即选择 <ChevronRight size={16} />
                </div>
              </div>
            </button>

            {/* Remote Project Card */}
            <button
              onClick={handleFetchRemote}
              disabled={loading}
              className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-emerald-500/30 hover:-translate-y-2 transition-all text-left relative overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 mb-8 shadow-inner">
                  <Github size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">远端源码项目</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                  {isUpdate ? '下载最新的更新包，系统将自动读取既有配置并执行部署。' : '从 GitHub 直接获取最新的源码包，解压到指定位置并自动加载项目配置。'}
                </p>
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                  {isUpdate ? '下载更新包' : '获取远端项目'} <ChevronRight size={16} />
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                <Loader2
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse"
                  size={24}
                />
              </div>
              <p className="text-sm font-bold text-slate-600 animate-pulse">
                正在处理您的请求，请稍候...
              </p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 flex items-start gap-4 animate-in slide-in-from-bottom-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 shrink-0">
                <ArrowLeft className="rotate-90" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-600 mb-1">加载失败</h4>
                <p className="text-xs text-red-500 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && projectInfo && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">第二步：项目{isUpdate ? '更新' : '配置'}确认</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">{isUpdate ? '请确认相关资源绑定，更新模式下配置不可更改' : '配置您的项目环境与资源绑定'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-primary" />
                  基础项目信息 {isUpdate && '(只读)'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      项目名称 (name)
                    </label>
                    <input
                      type="text"
                      disabled={isUpdate}
                      value={configFields.name}
                      onChange={(e) => setConfigFields({ ...configFields, name: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        数据库名称 (database)
                      </label>
                      {!isUpdate && isD1NameConflict && (
                        <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                          已有
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={isUpdate}
                      value={configFields.database_name}
                      onChange={(e) =>
                        setConfigFields({ ...configFields, database_name: e.target.value })
                      }
                      className={`w-full px-5 py-3 bg-slate-50 border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-75 disabled:cursor-not-allowed ${!isUpdate && isD1NameConflict ? 'border-amber-200 focus:border-amber-500' : 'border-slate-100'
                        }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        R2 存储桶 (bucket)
                      </label>
                      {!isUpdate && isR2NameConflict && (
                        <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                          已有
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={isUpdate}
                      value={configFields.bucket_name}
                      onChange={(e) =>
                        setConfigFields({ ...configFields, bucket_name: e.target.value })
                      }
                      className={`w-full px-5 py-3 bg-slate-50 border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-75 disabled:cursor-not-allowed ${!isUpdate && isR2NameConflict ? 'border-amber-200 focus:border-amber-500' : 'border-slate-100'
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  安全与敏感配置 {isUpdate && '(只读)'}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      后台验证码 (CAPTCHA)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={isUpdate}
                        value={configFields.CF_ADMIN_CAPTCHA}
                        onChange={(e) =>
                          setConfigFields({ ...configFields, CF_ADMIN_CAPTCHA: e.target.value })
                        }
                        className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                      {!isUpdate && (
                        <button
                          onClick={() =>
                            setConfigFields({
                              ...configFields,
                              CF_ADMIN_CAPTCHA: generateRandomString(12)
                            })
                          }
                          className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      JWT 密钥 (JWT_SECRET)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        disabled={isUpdate}
                        value={configFields.JWT_SECRET}
                        onChange={(e) =>
                          setConfigFields({ ...configFields, JWT_SECRET: e.target.value })
                        }
                        className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                      {!isUpdate && (
                        <button
                          onClick={() =>
                            setConfigFields({
                              ...configFields,
                              JWT_SECRET: generateRandomString(32)
                            })
                          }
                          className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(isUpdate && detectedMigrations.length > 0) && (
            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4 animate-in slide-in-from-bottom-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-amber-600 mb-1">数据库迁移提示</h4>
                <p className="text-xs text-amber-700 font-medium leading-relaxed mb-2">
                  检测到项目中包含 {detectedMigrations.length} 个新的迁移文件（不含 schema.sql）。代码更新完成后，系统将自动依次执行这些迁移脚本。
                </p>
                <div className="bg-white/50 p-3 rounded-xl space-y-1">
                  {detectedMigrations.map((m, idx) => (
                    <div key={idx} className="text-[10px] font-mono text-amber-800 flex items-center gap-2">
                      <ChevronRight size={10} className="shrink-0" />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(!isUpdate || (isUpdate && detectedMigrations.length === 0)) && (
            <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-[11px] text-indigo-900/60 font-medium leading-relaxed">
                {isUpdate 
                  ? '已检测项目文件，配置文件已锁定。点击下方按钮开始更新代码。' 
                  : '系统将自动在您的 Cloudflare 账户中创建或复用资源。若有疑问，请访查帮助中心。'}
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setStep(1)}
              className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
            >
              返回上一步
            </button>
            <button
              onClick={handleStartDeploy}
              disabled={fetchingConfig}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:-translate-y-1 hover:bg-slate-800 active:scale-95 transition-all group flex items-center gap-3 disabled:opacity-50"
            >
              <span>{isUpdate ? '立即更新部署' : '一键部署'}</span>
              {fetchingConfig ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">第三步：系统部署</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              正在将您的应用推送到 Cloudflare 网络
            </p>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative group">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                </div>
                <div className="h-4 w-px bg-slate-800 mx-2" />
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Terminal size={12} className="text-primary" />
                  Deployment Console
                </div>
              </div>
              {deployStatus === 'running' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Deploying...
                  </span>
                </div>
              )}
            </div>

            <div ref={consoleRef} className="p-8 h-[350px] overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar scroll-smooth">
              {deployLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-3 animate-in slide-in-from-left-2 duration-300 ${log.startsWith('[ERR]') || log.startsWith('[ERROR]') || log.startsWith('[异常]')
                    ? 'text-red-400'
                    : log.startsWith('[SUCCESS]') || log.startsWith('🎉')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                    }`}
                >
                  <span className="text-slate-600 select-none w-4 tabular-nums">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{log}</span>
                </div>
              ))}
              {deployStatus === 'running' && (
                <div className="flex gap-3 text-primary animate-pulse">
                  <span className="text-slate-600 select-none w-4">{deployLogs.length + 1}</span>
                  <span>_</span>
                </div>
              )}
              <div id="logs-end" />
            </div>

            {/* Success Overlay */}
            {deployStatus === 'success' && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-8 animate-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-slate-100 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 relative">
                  <button
                    onClick={() => setDeployStatus('idle')}
                    className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X size={20} />
                  </button>
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Zap size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">部署成功！</h3>
                  <p className="text-sm text-slate-500 font-medium mb-8">
                    您的应用已经上线，可通过以下地址访问：
                  </p>

                  <div className="flex flex-col gap-4">
                    <a
                      href={deployedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-primary font-black text-xs break-all hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 group"
                    >
                      {deployedUrl}
                      <ExternalLink
                        size={14}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      />
                    </a>
                    <button
                      onClick={() => onBack('backend')}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/30"
                    >
                      完成并返回
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {deployStatus === 'failure' && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-8 animate-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-red-100 relative">
                  <button
                    onClick={() => setDeployStatus('idle')}
                    className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X size={20} />
                  </button>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">部署失败</h3>
                  <p className="text-sm text-slate-500 font-medium mb-8">
                    部署过程中遇到错误，请检查日志并重试。
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      修改配置
                    </button>
                    <button
                      onClick={handleStartDeploy}
                      className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/30"
                    >
                      重新部署
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secure Deployment via Cloudflare
            </div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              v1.0.0 Stable
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeployProcess
