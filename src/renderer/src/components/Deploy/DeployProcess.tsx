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
  const [previewingMigration, setPreviewingMigration] = useState<string | null>(null)
  const [selectedMigrations, setSelectedMigrations] = useState<string[]>([])
  const [fetchingConfig, setFetchingConfig] = useState(false)
  const [previewContent, setPreviewContent] = useState<string>('')
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
  const [deployProgress, setDeployProgress] = useState(0)
  const [deployStatus, setDeployStatus] = useState<'idle' | 'running' | 'success' | 'failure'>(
    'idle'
  )
  const [deployedUrl, setDeployedUrl] = useState('')
  const [existingResources, setExistingResources] = useState<{ d1: D1Database[]; r2: R2Bucket[] }>({
    d1: [],
    r2: []
  })
  const [detectedMigrations, setDetectedMigrations] = useState<string[]>([])
  const [updateSubSites, setUpdateSubSites] = useState(false)

  // 帮助文档地址
  const HELP_URL = 'https://docs.soft.ycz.me/dream-admin/deploy'
  React.useEffect(() => {
    if (step === 2 && configFields.CF_API_TOKEN && configFields.CF_ACCOUNT_ID) {
      window.api.cloudflare
        .listResources(configFields.CF_API_TOKEN, configFields.CF_ACCOUNT_ID)
        .then(setExistingResources)
        .catch(console.error)
    }
  }, [step, configFields.CF_API_TOKEN, configFields.CF_ACCOUNT_ID])

  React.useEffect(() => {
    if (isUpdate && detectedMigrations.length > 0) {
      setSelectedMigrations(detectedMigrations)
    } else {
      setSelectedMigrations([])
    }
  }, [isUpdate, detectedMigrations, setSelectedMigrations])

  const isD1NameConflict = existingResources.d1.some((db) => db.name === configFields.database_name)
  const isR2NameConflict = existingResources.r2.some((b) => b.name === configFields.bucket_name)

  const consoleRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [deployLogs])


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

  // 开始部署流程
  const handleStartDeploy = async (): Promise<void> => {
    if (!projectInfo || !configFields.CF_API_TOKEN || !configFields.CF_ACCOUNT_ID) {
      setError('Cloudflare 凭证不完整，请返回第一步检查。')
      return
    }

    setDeployStatus('running')
    setStep(3)
    setDeployLogs(['[START] 开始部署流程...', `[INFO] 项目模式: ${isUpdate ? '更新部署' : '新应用部署'}`])
    setDeployProgress(5)

    try {
      let resources = { d1Id: configFields.database_id, r2Name: configFields.bucket_name }

      if (!isUpdate) {
        // 1. 创建 D1 和 R2 资源
        setDeployLogs((prev) => [...prev, '正在初始化 Cloudflare 资源 (D1, R2)...'])
        setDeployProgress(15)
        const d1Name = configFields.database_name || 'dream-db'
        const r2Name = configFields.bucket_name || 'dream-assets'

        const newResources = await window.api.cloudflare.createResources(
          configFields.CF_API_TOKEN.trim(),
          configFields.CF_ACCOUNT_ID.trim(),
          { d1Name, r2Name }
        )
        resources = newResources
        setConfigFields((prev) => ({ ...prev, database_id: resources.d1Id, database_name: d1Name, bucket_name: r2Name }))
      }

      // 2. 更新 wrangler.toml
      setDeployLogs((prev) => [...prev, '正在同步配置文件 (wrangler.toml)...'])
      setDeployProgress(30)
      const configStr = projectInfo.config
      const updatedConfig = configStr
        .replace(/name = ".*"/, `name = "${configFields.name}"`)
        .replace(/database_name = ".*"/, `database_name = "${configFields.database_name}"`)
        .replace(/database_id = ".*"/, `database_id = "${resources.d1Id}"`)
        .replace(/bucket_name = ".*"/, `bucket_name = "${resources.r2Name}"`)
        // 移除可能存在的同名普通变量，防止与 Secrets API 冲突
        .replace(/^CF_ADMIN_CAPTCHA\s*=\s*".*"/gm, '')
        .replace(/^JWT_SECRET\s*=\s*".*"/gm, '')

      await window.api.wrangler.saveConfig(projectInfo.path, updatedConfig)

      // 3. 构建项目 (通常后端 backend 需要 npm run build)
      const buildCommand = projectInfo.path.toLowerCase().includes('backend') ? 'npm run build' : ''
      if (buildCommand) {
        setDeployLogs((prev) => [...prev, '正在执行项目构建命令...'])
        setDeployProgress(45)
        try {
          await new Promise<void>((resolve, reject) => {
            window.api.project.run({
              cwd: projectInfo.path,
              command: buildCommand,
              args: [],
              env: {
                CLOUDFLARE_API_TOKEN: configFields.CF_API_TOKEN.trim(),
                CLOUDFLARE_ACCOUNT_ID: configFields.CF_ACCOUNT_ID.trim()
              }
            })
            window.api.project.onClose((code) => (code === 0 ? resolve() : reject(new Error(`Exit code ${code}`))))
            window.api.project.onError((err) => reject(new Error(err)))
          })
          setDeployLogs((prev) => [...prev, '[SUCCESS] 项目构建完成'])
        } catch (bErr: any) {
          setDeployLogs((prev) => [...prev, `[INFO] 构建步骤提示: ${bErr.message || String(bErr)} (如果仓库已包含 dist 目录，此步骤通常可跳过)`])
        }
      }

      // 4. 执行部署 (wrangler deploy)
      setDeployLogs((prev) => [...prev, '正在上传代码至 Cloudflare 全球网络...'])
      setDeployProgress(60)

      await runWranglerCommand(['deploy'])
      setDeployLogs((prev) => [...prev, '[SUCCESS] 代码部署已完成'])

      // 5. 设置环境变量 (仅在新部署模式下需初始化环境变量)
      if (!isUpdate) {
        setDeployLogs((prev) => [...prev, '正在初始化应用环境变量 (Secrets)...'])
        setDeployProgress(80)

        // 增加短暂延迟，确保 Cloudflare 管理面已同步新脚本
        setDeployLogs((prev) => [...prev, '[INFO] 等待 Cloudflare 网络同步 (2s)...'])
        await new Promise(resolve => setTimeout(resolve, 2000))

        const apiToken = configFields.CF_API_TOKEN.trim()
        const accountId = configFields.CF_ACCOUNT_ID.trim()
        const scriptName = configFields.name.trim()
        const secrets = {
          CF_ADMIN_CAPTCHA: configFields.CF_ADMIN_CAPTCHA,
          JWT_SECRET: configFields.JWT_SECRET
        }

        for (const [key, val] of Object.entries(secrets)) {
          if (!val) {
            setDeployLogs((prev) => [...prev, `[INFO] 跳过未配置的变量: ${key}`])
            continue
          }

          let success = false
          let retries = 0
          const maxRetries = 2

          while (!success && retries <= maxRetries) {
            try {
              if (retries > 0) {
                setDeployLogs((prev) => [...prev, `[INFO] 正在重试同步 Secret: ${key} (第 ${retries} 次)...`])
                await new Promise((resolve) => setTimeout(resolve, 1000))
              } else {
                setDeployLogs((prev) => [...prev, `正在同步 Secret: ${key}...`])
              }

              await window.api.cloudflare.updateWorkerVar(
                apiToken,
                accountId,
                scriptName,
                key,
                String(val)
              )
              success = true
            } catch (err: any) {
              retries++
              if (retries > maxRetries) {
                throw err
              }
            }
          }
        }
        setDeployLogs((prev) => [...prev, '[SUCCESS] 环境变量初始化完成'])
      }

      // 6. 数据库迁移逻辑
      let dbOperationSuccess = true
      try {
        if (!isUpdate) {
          // 初始化新部署的数据库架构
          const schemaPath = `${projectInfo.path}/schema.sql`
          const hasSchema = await window.api.project.exists(schemaPath)
          if (hasSchema) {
            setDeployLogs((prev) => [...prev, '正在初始化数据库架构 (schema.sql)...'])
            setDeployProgress(90)
            // 使用 --database 标志确保通过 ID 正确执行，DB 是 wrangler.toml 中的绑定名
            await runWranglerCommand(['d1', 'execute', 'DB', '--remote', `--database=${resources.d1Id}`, '--file=schema.sql', '-y'])
            setDeployLogs((prev) => [...prev, '[SUCCESS] 数据库初始化完成'])
          }
        } else if (selectedMigrations.length > 0) {
          // 更新部署模式：先获取所有需要迁移的数据库 ID 列表
          setDeployLogs((prev) => [...prev, '正在初始化数据库同步任务...'])
          const targetDatabases = [configFields.database_id] // 初始包含主库

          if (updateSubSites) {
            try {
              const res = await window.api.cloudflare.queryD1(
                configFields.CF_API_TOKEN.trim(),
                configFields.CF_ACCOUNT_ID.trim(),
                configFields.database_id,
                'SELECT database_id FROM sites'
              )
              const sitesList = res.result?.[0]?.results || []
              const subSiteIds = sitesList
                .map((s: any) => s.database_id)
                .filter((id: string) => !!id && id !== configFields.database_id)

              if (subSiteIds.length > 0) {
                targetDatabases.push(...subSiteIds)
                setDeployLogs((prev) => [...prev, `[INFO] 共发现 ${subSiteIds.length} 个子站数据库，将与主库一并迁移`])
              }
            } catch (syncErr: any) {
              setDeployLogs((prev) => [...prev, `[WARNING] 获取子站列表失败 (跳过子站同步): ${syncErr.message || String(syncErr)}`])
            }
          }

          // 统一执行迁移循环
          setDeployLogs((prev) => [...prev, `开始对 ${targetDatabases.length} 个数据库执行 ${selectedMigrations.length} 个迁移文件...`])
          for (const dbId of targetDatabases) {
            const isMain = dbId === configFields.database_id
            setDeployProgress((prev) => Math.min(prev + 20 / targetDatabases.length, 98))
            setDeployLogs((prev) => [...prev, `>> 正在执行库: ${dbId}${isMain ? ' (主库)' : ' (子库)'}`])

            for (const m of selectedMigrations) {
              try {
                // 如果迁移文件在 migrations 目录下，路径需要包含 migrations/
                const filePath = m // m 已经是 'migrations/file.sql' 或 'file.sql' 了
                // 统一使用 --database 标志显式指定目标数据库 ID
                await runWranglerCommand(['d1', 'execute', 'DB', '--remote', `--database=${dbId}`, `--file=${filePath}`, '-y'])
                setDeployLogs((prev) => [...prev, `   [OK] ${m} 执行完成`])
              } catch (mErr: any) {
                dbOperationSuccess = false
                setDeployLogs((prev) => [...prev, `   [ERR] ${m} 执行失败: ${mErr.message || '未知错误'}`])
              }
            }
          }
          setDeployLogs((prev) => [...prev, '[SUCCESS] 数据库迁移任务执行完毕'])
        }
      } catch (dbGlobalErr: any) {
        dbOperationSuccess = false
        setDeployLogs((prev) => [...prev, `[WARNING] 数据库迁移步骤异常: ${dbGlobalErr.message || String(dbGlobalErr)}`])
      }

      setDeployProgress(100)
      setDeployStatus('success')
      setDeployLogs((prev) => [...prev, `[FINISH] 部署任务执行完毕${dbOperationSuccess ? '' : ' (注意: 数据库部分操作有失败，详见日志)'}`])

      // 保存到本地历史
      const history = JSON.parse(localStorage.getItem('deploy_history') || '[]')
      const newEntry = {
        name: configFields.name,
        type: type,
        url: deployedUrl || `https://${configFields.name}.workers.dev`,
        d1Id: resources.d1Id,
        d1Name: configFields.database_name,
        timestamp: Date.now()
      }
      localStorage.setItem('deploy_history', JSON.stringify([newEntry, ...history]))

    } catch (finalErr: any) {
      console.error('Deployment Failure:', finalErr)
      setDeployStatus('failure')
      setDeployLogs((prev) => [
        ...prev,
        `[FATAL] 部署由于不可恢复错误而中断: ${finalErr.message || String(finalErr)}`,
        `建议访问官方指南排查常见问题: ${HELP_URL}`
      ])
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
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">第二步：项目确认</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">{isUpdate ? '请确认相关资源绑定，更新模式下配置不可更改' : '配置您的项目环境与资源绑定'}</p>
          </div>

          <div className={isUpdate ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "grid grid-cols-1 gap-8"}>
            <div className={!isUpdate ? "space-y-6 flex gap-6" : "space-y-6"}>
              <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6 ${!isUpdate ? 'flex-1' : ''}`}>
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

              {!isUpdate && (
                <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    安全与敏感配置
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        后台验证码 (CAPTCHA)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={configFields.CF_ADMIN_CAPTCHA}
                          onChange={(e) =>
                            setConfigFields({ ...configFields, CF_ADMIN_CAPTCHA: e.target.value })
                          }
                          className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                        />
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
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        JWT 密钥 (JWT_SECRET)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={configFields.JWT_SECRET}
                          onChange={(e) =>
                            setConfigFields({ ...configFields, JWT_SECRET: e.target.value })
                          }
                          className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                        />
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
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: isUpdate ? "block" : "none" }} className="space-y-6">
              {isUpdate && detectedMigrations.length > 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Terminal size={14} className="text-primary" />
                    数据库迁移解析
                  </h3>

                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
                    style={{ maxHeight: "120px" }}
                  >
                    {detectedMigrations.map((m) => (
                      <div key={m} className={`flex items-center gap-3 px-4 py-1 rounded-xl border transition-all group ${selectedMigrations.includes(m) ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                        }`}>
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedMigrations.includes(m)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMigrations([...selectedMigrations, m])
                              } else {
                                setSelectedMigrations(selectedMigrations.filter(item => item !== m))
                              }
                            }}
                          />
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${selectedMigrations.includes(m) ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 group-hover:border-slate-300'
                            }`}>
                            {selectedMigrations.includes(m) && <CheckCircle2 size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-black text-slate-700">{m}</div>
                          </div>
                        </label>
                        <button
                          onClick={async () => {
                            try {
                              const content = await window.api.project.readFile(`${projectInfo.path}/${m}`)
                              setPreviewContent(content)
                              setPreviewingMigration(m)
                            } catch (e) {
                              setError('读取文件失败')
                            }
                          }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="查看文件内容"
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {previewingMigration && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Terminal size={12} />
                          Preview: {previewingMigration}
                        </div>
                        <button
                          onClick={() => setPreviewingMigration(null)}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          收起预览
                        </button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-400/90 leading-relaxed custom-scrollbar border border-slate-800 shadow-inner">
                        <pre className="whitespace-pre-wrap">{previewContent}</pre>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-50 flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={updateSubSites}
                          onChange={(e) => setUpdateSubSites(e.target.checked)}
                        />
                        <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-primary transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">
                        是否执行子站数据库同步
                      </span>
                    </label>
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0" title="勾选后将自动查询 sites 表并同步迁移">
                      <AlertCircle size={14} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
          {isUpdate && (
            <div className="px-8 py-2 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex flex-col gap-4">
              <div className="flex items-center gap-4 text-indigo-600">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-tight">项目文件已解析。确认迁移文件及同步选项无误后，点击“立即更新部署”开始执行代码与数据库的热更新。</h4>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-6 pt-4">
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

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 w-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                style={{ width: `${deployProgress}%` }}
              />
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
