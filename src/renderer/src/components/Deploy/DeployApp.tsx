import React, { useState, useEffect } from 'react'
import { Plus, History, Cloud, Settings, ExternalLink, ShieldCheck, Zap } from 'lucide-react'
import DeployConfigModal from './DeployConfigModal'
import DeployProcess from './DeployProcess'

interface DeploymentRecord {
  name: string
  date: string
  status: 'success' | 'failure'
}

const DeployApp: React.FC = () => {
  const [view, setView] = useState<'initial' | 'deploy-backend' | 'deploy-frontend'>('initial')
  const [config, setConfig] = useState<{ apiToken: string; accountId: string } | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [history, setHistory] = useState<DeploymentRecord[]>([])

  useEffect(() => {
    // Load config
    const savedConfig = localStorage.getItem('cloudflare_config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }

    // Load history (mock for now or from localStorage)
    const savedHistory = localStorage.getItem('deployment_history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const handleSaveConfig = (newConfig: { apiToken: string; accountId: string }): void => {
    localStorage.setItem('cloudflare_config', JSON.stringify(newConfig))
    setConfig(newConfig)
  }

  const handleStartDeployBackend = (): void => {
    if (!config) {
      setIsConfigModalOpen(true)
      return
    }
    setView('deploy-backend')
  }

  const handleStartDeployFrontend = (): void => {
    if (!config) {
      setIsConfigModalOpen(true)
      return
    }
    // For now, only backend process is requested
    console.log('Start Deploy Frontend')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden font-sans relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

      <main className="relative z-10 w-full">
        {view === 'initial' && (
          <div className="mx-auto max-w-6xl animate-in fade-in px-8 py-10 duration-700">
            {/* History Section */}
            {history.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <History className="text-slate-400" size={20} />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    部署历史记录
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-all">
                          <Zap size={18} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 px-3 py-1 bg-emerald-50 rounded-full">
                          Success
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">{item.name}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        最后部署: {item.date}
                      </p>
                    </div>
                  ))}
                  <div className="bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-300 min-h-[160px]">
                    <Plus size={24} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      暂无更多记录
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Action Area */}
            <div className="mb-16 text-center">
              {history.length === 0 && (
                <div className="mb-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-8 shadow-xl shadow-primary/10">
                    <Cloud size={40} />
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                    开始您的应用部署
                  </h1>
                  <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                    简单几步，将您的梦幻管理台部署到 Cloudflare。支持项目自动解压与环境预检。
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                <button
                  onClick={handleStartDeployFrontend}
                  className="group relative w-full max-w-sm"
                >
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-emerald-500/30 hover:-translate-y-2 transition-all active:scale-95 text-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-inner">
                      <Zap size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">部署前端页面</h3>
                    <p className="text-xs text-slate-400 font-medium px-4">
                      快速部署您的 Dream Admin 后台前端 UI
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleStartDeployBackend}
                  className="group relative w-full max-w-sm"
                >
                  <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-primary/30 hover:-translate-y-2 transition-all active:scale-95 text-center">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
                      <Settings size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">部署管理后台</h3>
                    <p className="text-xs text-slate-400 font-medium px-4">
                      配置并部署 Hono 后端引擎及 D1 数据库
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Config Footer */}
            <div className="flex flex-col items-center">
              <div className="bg-white/80 backdrop-blur-md px-10 py-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-wrap items-center gap-10">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${config ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}
                  >
                    {config ? <ShieldCheck size={24} /> : <Cloud size={24} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      基础设施配置
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {config
                        ? `已绑定: Account-${config.accountId.substring(0, 8)}...`
                        : '尚未配置 Cloudflare 账户'}
                    </p>
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-100 hidden sm:block" />

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                  >
                    {config ? '修改配置' : '立即配置'}
                  </button>
                  <a
                    href="https://blog.ycz.me"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-indigo-700 text-xs font-black transition-colors group"
                  >
                    查看配置教程
                    <ExternalLink
                      size={14}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'deploy-backend' && <DeployProcess onBack={() => setView('initial')} />}
      </main>

      <DeployConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveConfig}
        initialConfig={config || undefined}
      />
    </div>
  )
}

export default DeployApp
