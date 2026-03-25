import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, History, Cloud, Settings, ExternalLink, ShieldCheck, Zap, 
  RefreshCw, XCircle, ChevronRight, Globe, Layers, Database, Trash2, Edit3, AlertTriangle 
} from 'lucide-react'
import DeployConfigModal from './DeployConfigModal'
import DeployProcess from './DeployProcess'

interface DeploymentRecord {
  name: string
  url: string
  d1Id: string
  d1Name: string
  r2Name: string
  timestamp: number
}

const DeployApp: React.FC = () => {
  const [view, setView] = useState<'initial' | 'deploy-backend' | 'deploy-frontend'>('initial')
  const [config, setConfig] = useState<{ apiToken: string; accountId: string } | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [history, setHistory] = useState<DeploymentRecord[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'success' | 'failure' | null>(null)

  const [activeTab, setActiveTab] = useState<'deploy' | 'pages' | 'workers' | 'data' | 'history'>('deploy')
  
  interface PagesProject {
    id: string
    name: string
    domains: string[]
  }

  interface WorkerService {
    id: string
    name: string
    modified_on: string
  }

  interface D1Database {
    uuid: string
    name: string
  }

  interface R2Bucket {
    name: string
    creation_date: string
  }

  interface CloudflareResources {
    d1: D1Database[]
    r2: R2Bucket[]
    pages: PagesProject[]
    workers: WorkerService[]
  }

  // Resource States
  const [resources, setResources] = useState<CloudflareResources>({
    d1: [],
    r2: [],
    pages: [],
    workers: []
  })
  const [loadingResources, setLoadingResources] = useState(false)
  const [resourceError, setResourceError] = useState('')

  useEffect(() => {
    // Load config
    const savedConfig = localStorage.getItem('cloudflare_config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }

    // Load history
    const savedHistory = localStorage.getItem('deploy_history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [view])

  const fetchResources = useCallback(async (): Promise<void> => {
    if (!config) return
    setLoadingResources(true)
    setResourceError('')
    try {
      const data = await window.api.cloudflare.listResources(config.apiToken, config.accountId)
      setResources(data)
    } catch (err: any) {
      setResourceError(err.message || '获取数据失败，请检查 API Token 权限或网络。')
    } finally {
      setLoadingResources(false)
    }
  }, [config])

  useEffect(() => {
    if (activeTab !== 'deploy' && activeTab !== 'history' && config) {
      fetchResources()
    }
  }, [activeTab, config, fetchResources])

  const handleSaveConfig = (newConfig: { apiToken: string; accountId: string }): void => {
    localStorage.setItem('cloudflare_config', JSON.stringify(newConfig))
    setConfig(newConfig)
    setVerifyStatus(null)
  }

  const handleVerify = async (): Promise<void> => {
    if (!config) return
    setIsVerifying(true)
    setVerifyStatus(null)

    try {
      const data = await window.api.cloudflare.verifyToken(config.apiToken, config.accountId)

      if (data.success) {
        setVerifyStatus('success')
        alert('验证成功：该 API Token 有效且处于激活状态')
      } else {
        setVerifyStatus('failure')
        const msg = data.errors?.[0]?.message || '验证失败'
        alert(`验证失败：${msg}`)
      }
    } catch {
      setVerifyStatus('failure')
      alert('验证失败：网络请求错误')
    } finally {
      setIsVerifying(false)
    }
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

  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false)
  const [domainModalTarget, setDomainModalTarget] = useState<{ type: 'page' | 'worker'; name: string } | null>(null)
  const [targetDomains, setTargetDomains] = useState<string[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const [newDomain, setNewDomain] = useState('')

  const handleOpenDomainModal = async (type: 'page' | 'worker', name: string): Promise<void> => {
    if (!config) return
    setDomainModalTarget({ type, name })
    setIsDomainModalOpen(true)
    setLoadingDomains(true)
    setTargetDomains([])
    try {
      if (type === 'page') {
        const domains = await window.api.cloudflare.getPageDomains(config.apiToken, config.accountId, name)
        setTargetDomains(domains.map((d: any) => d.name))
      } else {
        const allDomains = await window.api.cloudflare.getWorkerDomains(config.apiToken, config.accountId)
        setTargetDomains(allDomains.filter((d: any) => d.service === name).map((d: any) => d.hostname))
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err)
    } finally {
      setLoadingDomains(false)
    }
  }

  const handleAddDomain = async (): Promise<void> => {
    if (!config || !domainModalTarget || !newDomain) return
    setLoadingDomains(true)
    try {
      if (domainModalTarget.type === 'page') {
        await window.api.cloudflare.addPageDomain(config.apiToken, config.accountId, domainModalTarget.name, newDomain)
      } else {
        // For Workers, we need a Zone ID. For simplicity, we try to find a matching zone or ask.
        // Here we'll fetch zones and try to match the domain suffix.
        const zones = await window.api.cloudflare.getZones(config.apiToken, config.accountId)
        const matchingZone = zones.find((z: any) => newDomain.endsWith(z.name))
        if (!matchingZone) {
          throw new Error('未找到匹配的 Cloudflare Zone，请确保域名已添加到当前账户。')
        }
        await window.api.cloudflare.addWorkerDomain(config.apiToken, config.accountId, domainModalTarget.name, newDomain, matchingZone.id)
      }
      
      // Refresh domains
      if (domainModalTarget.type === 'page') {
        const domains = await window.api.cloudflare.getPageDomains(config.apiToken, config.accountId, domainModalTarget.name)
        setTargetDomains(domains.map((d: any) => d.name))
      } else {
        const allDomains = await window.api.cloudflare.getWorkerDomains(config.apiToken, config.accountId)
        setTargetDomains(allDomains.filter((d: any) => d.service === domainModalTarget.name).map((d: any) => d.hostname))
      }
      
      setNewDomain('')
      fetchResources()
    } catch (err: any) {
      alert(`添加域名失败: ${err.message || '请检查域名格式或 Cloudflare 权限。'}`)
    } finally {
      setLoadingDomains(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden font-sans relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

      <main className="relative z-10 w-full">
        {view === 'initial' && (
          <div className="mx-auto max-w-6xl animate-in fade-in px-8 py-10 duration-700">
            {/* Top Tab Navigation */}
            <div className="flex justify-center mb-10">
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-100 mb-8 inline-flex">
                {[
                  { id: 'deploy', label: '应用部署' },
                  { id: 'pages', label: '前端应用' },
                  { id: 'workers', label: '后端应用' },
                  { id: 'data', label: '数据管理' },
                  { id: 'history', label: '部署历史' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-900/5'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error or No Access Hint */}
            {activeTab !== 'deploy' && activeTab !== 'history' && (!config || resourceError) && (
              <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center mb-8 animate-in fade-in slide-in-from-bottom-4">
                <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
                <h3 className="text-xl font-black text-slate-800 mb-2">获取数据受限</h3>
                <p className="text-sm text-slate-400 font-medium mb-6">
                  {resourceError || '请先配置有效的 Cloudflare API Token 且确保拥有读取权限。'}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setIsConfigModalOpen(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                   >
                    立即配置
                  </button>
                  <a 
                    href="https://soft.ycz.me" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
                  >
                    查看教程 <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}

            {loadingResources ? (
              <div className="py-20 text-center">
                <RefreshCw className="animate-spin mx-auto text-slate-200" size={48} />
                <p className="text-sm font-bold text-slate-300 mt-4 uppercase tracking-widest">正在拉取资源列表...</p>
              </div>
            ) : (
              <>
                {activeTab === 'pages' && config && !resourceError && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Globe className="text-slate-400" size={20} />
                          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pages 应用列表</h2>
                        </div>
                        <button onClick={fetchResources} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><RefreshCw size={16} /></button>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        {resources.pages.map((p) => (
                           <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><Globe size={20} /></div>
                                 <div className="flex flex-col">
                                    <h4 className="font-black text-slate-800 leading-none mb-1">{p.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">域名: {p.domains?.join(', ') || '尚未绑定域名'}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleOpenDomainModal('page', p.name)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Edit3 size={14} /> 域名绑定</button>
                                 <button onClick={async () => {
                                   if (confirm(`确定要删除 Pages 应用 ${p.name} 吗？此操作不可撤销。`)) {
                                      await window.api.cloudflare.deletePage(config.apiToken, config.accountId, p.name)
                                      fetchResources()
                                   }
                                 }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {activeTab === 'workers' && config && !resourceError && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Layers className="text-slate-400" size={20} />
                          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Workers 应用列表</h2>
                        </div>
                        <button onClick={fetchResources} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><RefreshCw size={16} /></button>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        {resources.workers.map((w) => (
                           <div key={w.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary"><Zap size={20} /></div>
                                 <div className="flex flex-col">
                                    <h4 className="font-black text-slate-800 leading-none mb-1">{w.name || w.id}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">最后更新: {new Date(w.modified_on).toLocaleString()}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleOpenDomainModal('worker', w.name || w.id)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Edit3 size={14} /> 域名绑定</button>
                                 <button onClick={async () => {
                                   if (confirm(`确定要删除 Worker ${w.name || w.id} 吗？`)) {
                                      await window.api.cloudflare.deleteWorker(config.apiToken, config.accountId, w.name || w.id)
                                      fetchResources()
                                   }
                                 }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {activeTab === 'data' && config && !resourceError && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
                     {/* D1 Databases */}
                     <section>
                        <div className="flex items-center gap-3 mb-6">
                           <Database className="text-slate-400" size={20} />
                           <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">D1 数据库 ({resources.d1.length})</h2>
                        </div>
                        <div className="space-y-4">
                           {resources.d1.map((db: any) => (
                              <div key={db.uuid} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all flex items-center justify-between">
                                 <div>
                                    <h4 className="font-bold text-slate-800 mb-0.5">{db.name}</h4>
                                    <p className="text-[9px] text-slate-400 font-mono tracking-tighter">{db.uuid}</p>
                                 </div>
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={async () => {
                                       const newName = prompt('设置新的数据库名称:', db.name)
                                       if (newName && newName !== db.name) {
                                          await window.api.cloudflare.renameD1(config.apiToken, config.accountId, db.uuid, newName)
                                          fetchResources()
                                       }
                                    }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Edit3 size={12} /></button>
                                    <button onClick={async () => {
                                       if (confirm(`确定要彻底删除数据库 ${db.name} 吗？所有数据将丢失！`)) {
                                          await window.api.cloudflare.deleteD1(config.apiToken, config.accountId, db.uuid)
                                          fetchResources()
                                       }
                                    }} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </section>

                     {/* R2 Buckets */}
                     <section>
                        <div className="flex items-center gap-3 mb-6">
                           <Cloud className="text-slate-400" size={20} />
                           <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">R2 存储桶 ({resources.r2.length})</h2>
                        </div>
                        <div className="space-y-4">
                           {resources.r2.map((bucket: any) => (
                              <div key={bucket.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all flex items-center justify-between">
                                 <div>
                                    <h4 className="font-bold text-slate-800 mb-0.5">{bucket.name}</h4>
                                    <p className="text-[9px] text-slate-400 font-medium">创建于: {new Date(bucket.creation_date).toLocaleDateString()}</p>
                                 </div>
                                 <button onClick={async () => {
                                    if (confirm(`确定要删除存储桶 ${bucket.name} 吗？`)) {
                                       await window.api.cloudflare.deleteR2(config.apiToken, config.accountId, bucket.name)
                                       fetchResources()
                                    }
                                 }} className="p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                              </div>
                           ))}
                        </div>
                     </section>
                  </div>
                )}

                {activeTab === 'history' && (
                  /* History Section */
                  <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-8">
                      <History className="text-slate-400" size={20} />
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        部署项目记录
                      </h2>
                    </div>
                    {history.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-all">
                                <Cloud size={18} />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 px-3 py-1 bg-slate-50 rounded-full">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2">{item.name}</h3>
                            <div className="space-y-1.5 text-[10px] font-medium text-slate-400">
                              <p className="flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                 D1: {item.d1Name}
                              </p>
                              <p className="flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                 R2: {item.r2Name}
                              </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                               <a 
                                 href={item.url} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1 hover:underline"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 访问地址 <ExternalLink size={10} />
                               </a>
                            </div>
                          </div>
                        ))}
                        <div className="bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-300 min-h-[160px]">
                          <Plus size={24} className="mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            暂无更多记录
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <History className="text-slate-100 mx-auto mb-4" size={48} />
                        <p className="text-sm font-bold text-slate-300">暂无任何部署记录</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'deploy' && (
                  /* Deployment Main Action Area */
                  <div className="mb-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto mb-6 shadow-xl shadow-primary/10">
                        <Cloud size={32} />
                      </div>
                      <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                        开始您的应用部署
                      </h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                      <button
                        onClick={handleStartDeployFrontend}
                        className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-emerald-500/30 hover:-translate-y-1 transition-all active:scale-[0.99] text-left flex items-center gap-6 w-full max-w-lg"
                      >
                        <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                          <Zap size={28} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-slate-900">
                            部署前端页面
                          </h3>
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors" size={20} />
                      </button>

                      <button
                        onClick={handleStartDeployBackend}
                        className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-primary/30 hover:-translate-y-1 transition-all active:scale-[0.99] text-left flex items-center gap-6 w-full max-w-lg"
                      >
                        <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-primary shrink-0 shadow-inner">
                          <Settings size={28} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-slate-900">
                            部署管理后台
                          </h3>
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors" size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Config Footer */}
            <div className="flex flex-col items-center">
              <div className="bg-white/80 backdrop-blur-md px-10 py-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-wrap items-center gap-10">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${config ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}
                  >
                    {verifyStatus === 'success' ? (
                      <ShieldCheck size={24} />
                    ) : verifyStatus === 'failure' ? (
                      <XCircle size={24} className="text-red-500" />
                    ) : config ? (
                      <ShieldCheck size={24} />
                    ) : (
                      <Cloud size={24} />
                    )}
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
                  {config && (
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isVerifying ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      验证
                    </button>
                  )}
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                  >
                    {config ? '修改配置' : '立即配置'}
                  </button>
                  <a
                    href="https://soft.ycz.me/help"
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

      <DomainBindingModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        type={domainModalTarget?.type || 'page'}
        name={domainModalTarget?.name || ''}
        domains={targetDomains}
        loading={loadingDomains}
        onAdd={handleAddDomain}
        newDomain={newDomain}
        setNewDomain={setNewDomain}
      />
    </div>
  )
}

interface DomainBindingModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'page' | 'worker'
  name: string
  domains: string[]
  loading: boolean
  onAdd: () => Promise<void>
  newDomain: string
  setNewDomain: (val: string) => void
}

const DomainBindingModal: React.FC<DomainBindingModalProps> = ({ 
  isOpen, onClose, type, name, domains, loading, onAdd, newDomain, setNewDomain 
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">域名绑定</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {type === 'page' ? 'Pages Project' : 'Worker'}: {name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
            >
              <XCircle size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                已绑定域名 ({domains.length})
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {domains.length > 0 ? (
                  domains.map((d, i) => (
                    <div key={i} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
                      <span className="text-sm font-bold text-slate-700">{d}</span>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-300">尚未绑定任何自定义域名</p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                添加新域名
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="例如: example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
                <button
                  onClick={onAdd}
                  disabled={loading || !newDomain}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  增加
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-medium text-slate-400">
            绑定域名后，请确保在 Cloudflare DNS 中配置了正确的 CNAME 记录。
          </p>
        </div>
      </div>
    </div>
  )
}

export default DeployApp
