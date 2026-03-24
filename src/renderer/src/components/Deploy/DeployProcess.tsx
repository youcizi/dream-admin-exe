import React, { useState } from 'react'
import {
  FolderOpen,
  Github,
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  ChevronRight
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

  const handleSelectLocal = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      // @ts-ignore (electron api)
      const path = await window.api.project.openDirectory()
      if (!path) {
        setLoading(false)
        return
      }

      // @ts-ignore (electron api)
      const projects = await window.api.wrangler.scanProjects(path)
      if (projects && projects.length > 0) {
        setProjectInfo(projects[0])
        setStep(2)
      } else {
        setError('在选中目录中未找到相关的项目配置文件 (wrangler.toml)')
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
      const remoteUrl =
        'https://github.com/youcizi/dream-admin/archive/refs/heads/sitegroup/min.zip'

      // Select a local directory to extract to
      // @ts-ignore (electron api)
      const baseDir = await window.api.project.openDirectory()
      if (!baseDir) {
        setLoading(false)
        return
      }

      // @ts-ignore (electron api)
      const projectPath = await window.api.project.downloadAndExtract(remoteUrl, baseDir)

      // @ts-ignore (electron api)
      const projects = await window.api.wrangler.scanProjects(projectPath)
      if (projects && projects.length > 0) {
        setProjectInfo(projects[0])
        setStep(2)
      } else {
        setError('下载的项目中未找到相关的项目配置文件 (wrangler.toml)')
      }
    } catch (err: unknown) {
      setError(`下载远端项目失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
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
        <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center max-w-2xl mx-auto py-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-lg shadow-emerald-500/10">
            <FileText size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">项目加载成功！</h2>
          <p className="text-slate-500 mb-10">我们已经成功解析了项目路径下的配置文件：</p>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-left space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  项目名称
                </span>
                <p className="text-xl font-black text-slate-900">{projectInfo.name}</p>
              </div>
              <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Validated
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                本地路径
              </span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono text-slate-600 break-all select-all">
                {projectInfo.path}
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6">
            <button
              onClick={() => setStep(1)}
              className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
            >
              重选项目
            </button>
            <button className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-900/40 hover:-translate-y-1 hover:bg-slate-800 active:scale-95 transition-all outline-none">
              下一步：环境配置
            </button>
          </div>

          <p className="text-[10px] text-slate-400 mt-10 font-bold uppercase tracking-widest animate-pulse">
            按计划，当前步骤实现至加载项目配置文件为止
          </p>
        </div>
      )}
    </div>
  )
}

export default DeployProcess
