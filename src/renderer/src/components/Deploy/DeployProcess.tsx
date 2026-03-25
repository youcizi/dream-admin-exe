import React, { useState } from 'react'
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
  Zap
} from 'lucide-react'

interface ProjectInfo {
  path: string
  name: string
  config: string
}

interface DeployProcessProps {
  onBack: () => void
}

const DeployProcess: React.FC<DeployProcessProps> = ({ onBack }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
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

  React.useEffect(() => {
    const logsEnd = document.getElementById('logs-end')
    if (logsEnd) {
      logsEnd.scrollIntoView({ behavior: 'smooth' })
    }
  }, [deployLogs])

  const handleStartDeploy = async (): Promise<void> => {
    if (!projectInfo) return

    try {
      setDeployStatus('running')
      setStep(3)
      setDeployLogs(['开始部署流程...'])

      // 1. Create/Verify Cloudflare Resources
      setDeployLogs((prev) => [...prev, '正在验证 Cloudflare 资源 (D1 & R2)...'])
      const resources = await window.api.cloudflare.createResources(
        configFields.CF_API_TOKEN,
        configFields.CF_ACCOUNT_ID,
        {
          d1Name: configFields.database_name,
          r2Name: configFields.bucket_name
        }
      )
      setDeployLogs((prev) => [...prev, `Cloudflare 资源就绪: D1 ID = ${resources.d1Id}`])

      // 2. Prepare wrangler.toml content
      setDeployLogs((prev) => [...prev, '正在生成 wrangler.toml 配置文件...'])
      const tomlContent = `name = "${configFields.name}"
main = "index.js"
compatibility_date = "2024-03-25"
minify = true

[[d1_databases]]
binding = "DB"
database_name = "${configFields.database_name}"
database_id = "${resources.d1Id}"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "${configFields.bucket_name}"

[vars]
CF_ACCOUNT_ID = "${configFields.CF_ACCOUNT_ID}"
CF_API_TOKEN = "${configFields.CF_API_TOKEN}"
CF_ADMIN_CAPTCHA = "${configFields.CF_ADMIN_CAPTCHA}"
JWT_SECRET = "${configFields.JWT_SECRET}"
`
      // 3. Save wrangler.toml
      await window.api.wrangler.saveConfig(projectInfo.path, tomlContent)
      setDeployLogs((prev) => [...prev, 'wrangler.toml 配置文件已更新'])

      // 4. Run Wrangler Deploy
      setDeployLogs((prev) => [...prev, '正在启动部署命令: npx wrangler deploy...'])
      
      window.api.wrangler.onStdout((data) => {
        setDeployLogs((prev) => [...prev, data])
        // Extract domain from output
        const domainMatch = data.match(/https:\/\/(.*\.workers\.dev)/)
        if (domainMatch) {
          setDeployedUrl(domainMatch[0])
        }
      })

      window.api.wrangler.onStderr((data) => {
        setDeployLogs((prev) => [...prev, `[ERR] ${data}`])
      })

      window.api.wrangler.onError((err) => {
        setDeployLogs((prev) => [...prev, `[ERROR] ${err}`])
        setDeployStatus('failure')
      })

      window.api.wrangler.onClose((code) => {
        if (code === 0) {
          setDeployStatus('success')
          setDeployLogs((prev) => [...prev, '🎉 部署成功！'])
        } else {
          setDeployStatus('failure')
          setDeployLogs((prev) => [...prev, `部署终止，退出码: ${code}`])
        }
      })

      window.api.wrangler.run({
        cwd: projectInfo.path,
        args: ['deploy']
      })
    } catch (err: unknown) {
      setDeployLogs((prev) => [
        ...prev,
        `[异常] ${err instanceof Error ? err.message : String(err)}`
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

      const projects = await window.api.wrangler.scanProjects(path)
      if (projects && projects.length > 0) {
        setProjectInfo(projects[0])
        // Initialize config fields
        await parseExistingConfig(projects[0].path, projects[0].config)
        setStep(2)
      } else {
        setError('在选中目录中未找到相关的项目文件夹')
      }
    } catch (err: unknown) {
      setError(`选择文件夹失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchRemote = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const remoteUrl = 'https://soft.ycz.me/dreamadmin/dist.zip'

      const baseDir = await window.api.project.openDirectory()
      if (!baseDir) {
        setLoading(false)
        return
      }

      const projectPath = await window.api.project.downloadAndExtract(remoteUrl, baseDir)
      const projects = await window.api.wrangler.scanProjects(projectPath)
      
      if (projects && projects.length > 0) {
        setProjectInfo(projects[0])
        await parseExistingConfig(projects[0].path, projects[0].config)
        setStep(2)
      } else {
        setError('下载的项目无效')
      }
    } catch (err: unknown) {
      setError(`下载远端项目失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const parseExistingConfig = async (_projectPath: string, content: string): Promise<void> => {
    // Get stored Cloudflare config
    const savedConfig = localStorage.getItem('cloudflare_config')
    const cloudflareConfig = savedConfig ? JSON.parse(savedConfig) : {}

    const fields = {
      name: content.match(/^name\s*=\s*"(.*)"/m)?.[1] || 'dream-admin',
      database_name: content.match(/database_name\s*=\s*"(.*)"/m)?.[1] || 'dream-db',
      database_id: content.match(/database_id\s*=\s*"(.*)"/m)?.[1] || '',
      bucket_name: content.match(/bucket_name\s*=\s*"(.*)"/m)?.[1] || 'dream-assets',
      CF_ADMIN_CAPTCHA: content.match(/CF_ADMIN_CAPTCHA\s*=\s*"(.*)"/m)?.[1] || generateRandomString(12),
      JWT_SECRET: content.match(/JWT_SECRET\s*=\s*"(.*)"/m)?.[1] || generateRandomString(32),
      CF_ACCOUNT_ID: cloudflareConfig.accountId || '',
      CF_API_TOKEN: cloudflareConfig.apiToken || ''
    }
    setConfigFields(fields)
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:text-slate-900 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">部署管理后台</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              按照以下步骤完成您的系统部署
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 shadow-lg ${
                  step === s
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
                  从 GitHub 直接获取最新的源码包，解压到指定位置并自动加载项目配置。
                </p>
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                  获取远端项目 <ChevronRight size={16} />
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
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">第二步：环境配置</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">配置您的项目环境与资源绑定</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-primary" />
                  基础项目配置
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      项目名称 (name)
                    </label>
                    <input
                      type="text"
                      value={configFields.name}
                      onChange={(e) => setConfigFields({ ...configFields, name: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      数据库名称 (database_name)
                    </label>
                    <input
                      type="text"
                      value={configFields.database_name}
                      onChange={(e) =>
                        setConfigFields({ ...configFields, database_name: e.target.value })
                      }
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      R2 存储桶 (bucket_name)
                    </label>
                    <input
                      type="text"
                      value={configFields.bucket_name}
                      onChange={(e) =>
                        setConfigFields({ ...configFields, bucket_name: e.target.value })
                      }
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  安全与敏感配置
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      后台验证码 (CF_ADMIN_CAPTCHA)
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
                        title="自动生成"
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
                        type="text"
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
                        title="自动生成"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle2 size={12} /> 提示
                </p>
                <p className="text-[11px] text-indigo-900/60 font-medium leading-relaxed">
                  点击“一键部署”后，系统将自动在您的 Cloudflare 账户中创建 D1 数据库和 R2 存储桶，并自动回填 <code>wrangler.toml</code> 配置文件。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-6">
            <button
              onClick={() => setStep(1)}
              className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
            >
              返回上一步
            </button>
            <button
              onClick={handleStartDeploy}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:-translate-y-1 hover:bg-slate-800 active:scale-95 transition-all group flex items-center gap-3"
            >
              <span>一键部署</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

            <div className="p-8 h-[350px] overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar scroll-smooth">
              {deployLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-3 animate-in slide-in-from-left-2 duration-300 ${
                    log.startsWith('[ERR]') || log.startsWith('[ERROR]') || log.startsWith('[异常]')
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
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-slate-100 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
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
                      onClick={onBack}
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
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-red-100">
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
