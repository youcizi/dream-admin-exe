import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, History, Cloud, Settings, ExternalLink, ShieldCheck, Zap, 
  RefreshCw, XCircle, ChevronRight, Globe, Database, Trash2, AlertTriangle,
  Copy, Check, HelpCircle
} from 'lucide-react'
import DeployConfigModal from './DeployConfigModal'
import DeployProcess from './DeployProcess'
import D1Viewer from './D1Viewer'
import { R2Viewer } from './R2Viewer'
import WorkerConfigModal from './WorkerConfigModal'
import CloudflareTokenModal from './CloudflareTokenModal'


interface DeploymentRecord {
  name: string
  type: 'frontend' | 'backend'
  url: string
  d1Id: string
  d1Name: string
  r2Name: string
  timestamp: number
}

const HELP_URL = 'https://soft.ycz.me/help'

const DeployApp: React.FC = () => {
  const [view, setView] = useState<'initial' | 'deploy-backend' | 'deploy-frontend'>('initial')
  const [config, setConfig] = useState<{ apiToken: string; accountId: string } | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [history, setHistory] = useState<DeploymentRecord[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'success' | 'failure' | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const handleCopy = (text: string, id: string): void => {
    navigator.clipboard.writeText(text)
    setCopySuccess(id)
    setTimeout(() => setCopySuccess(null), 2000)
  }
  const [activeTab, setActiveTab] = useState<'deploy' | 'frontend' | 'backend' | 'data' | 'history'>('deploy')
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [resourceModalType, setResourceModalType] = useState<'d1' | 'r2' | null>(null)
  const [newResourceName, setNewResourceName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const [selectedD1, setSelectedD1] = useState<D1Database | null>(null)
  const [isD1ViewerOpen, setIsD1ViewerOpen] = useState(false)
  
  const [selectedR2, setSelectedR2] = useState<R2Bucket | null>(null)
  const [isR2ViewerOpen, setIsR2ViewerOpen] = useState(false)
  
  const [selectedWorker, setSelectedWorker] = useState<{ id: string; name: string } | null>(null)
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false)
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)

  
  interface PagesProject {
    id: string
    name: string
    domains: { name: string }[]
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
      const parsed = JSON.parse(savedConfig)
      // Only update if values are different to keep object identity stable
      setConfig(prev => {
        if (prev && prev.apiToken === parsed.apiToken && prev.accountId === parsed.accountId) {
          return prev
        }
        return parsed
      })
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
    } catch (err: unknown) {
      setResourceError(err instanceof Error ? err.message : '获取数据失败，请检查 API Token 权限或网络。')
    } finally {
      setLoadingResources(false)
    }
  }, [config])

  useEffect(() => {
    if (activeTab !== 'deploy' && activeTab !== 'history' && config) {
      fetchResources()
    }
  }, [activeTab, config, fetchResources])

  const handleCreateD1 = (): void => {
    setResourceModalType('d1')
    setNewResourceName('')
    setIsResourceModalOpen(true)
  }

  const handleCreateR2 = (): void => {
    setResourceModalType('r2')
    setNewResourceName('')
    setIsResourceModalOpen(true)
  }

  const handleConfirmCreateResource = async (): Promise<void> => {
    if (!config || !resourceModalType || !newResourceName) return
    setIsCreating(true)
    try {
      if (resourceModalType === 'd1') {
        await window.api.cloudflare.createD1(config.apiToken, config.accountId, newResourceName)
      } else {
        await window.api.cloudflare.createR2(config.apiToken, config.accountId, newResourceName)
      }
      setIsResourceModalOpen(false)
      fetchResources()
    } catch (err: any) {
      alert('创建失败: ' + (err.message || String(err)))
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteHistoryItem = (index: number): void => {
    if (!confirm('确定要删除这条部署记录吗？')) return
    const newHistory = [...history]
    newHistory.splice(index, 1)
    setHistory(newHistory)
    localStorage.setItem('deploy_history', JSON.stringify(newHistory))
  }

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
  const [targetDomains, setTargetDomains] = useState<{ name: string; id?: string }[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleOpenDomainModal = async (type: 'page' | 'worker', name: string): Promise<void> => {
    if (!config) return
    setDomainModalTarget({ type, name })
    setIsDomainModalOpen(true)
    setLoadingDomains(true)
    setTargetDomains([])
    setSuccessMsg(null)
    try {
      if (type === 'page') {
        const domains = await window.api.cloudflare.getPageDomains(config.apiToken, config.accountId, name)
        setTargetDomains(domains.map((d: any) => ({ name: d.name })))
      } else {
        const allDomains = await window.api.cloudflare.getWorkerDomains(config.apiToken, config.accountId)
        setTargetDomains(allDomains.filter((d: any) => d.service === name).map((d: any) => ({ name: d.hostname, id: d.id })))
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
      // 1. Find the best matching zone
      const zones = await window.api.cloudflare.getZones(config.apiToken, config.accountId)
      const matchingZone = zones
        .filter((z: any) => newDomain.endsWith(z.name))
        .sort((a: any, b: any) => b.name.length - a.name.length)[0]

      const zoneId = matchingZone?.id

      // 2. Add domain to Pages/Workers
      if (domainModalTarget.type === 'page') {
        // Step 0: Get project details to find correct subdomain
        let cnameTarget = `${domainModalTarget.name}.pages.dev`
        try {
          const projectDetails = await window.api.cloudflare.getPageDetails(
            config.apiToken,
            config.accountId,
            domainModalTarget.name
          )
          if (projectDetails?.subdomain) {
            cnameTarget = projectDetails.subdomain
          }
        } catch (detailErr) {
          console.error('Failed to fetch project details:', detailErr)
        }

        // Step A: Bind domain
        try {
          await window.api.cloudflare.addPageDomain(
            config.apiToken,
            config.accountId,
            domainModalTarget.name,
            newDomain
          )
        } catch (bindErr: any) {
          console.error('Binding failed:', bindErr)
          alert('绑定失败')
          return
        }

        // Step B: Set CNAME if zone exists
        let cnameSuccess = false
        if (zoneId) {
          try {
            await window.api.cloudflare.createDNSRecord(
              config.apiToken,
              zoneId,
              'CNAME',
              newDomain,
              cnameTarget,
              true
            )
            cnameSuccess = true
          } catch (dnsErr) {
            console.error('CNAME setting failed:', dnsErr)
            cnameSuccess = false
          }
        }

        if (cnameSuccess) {
          setSuccessMsg('绑定完成并已自动配置 CNAME！')
        } else if (zoneId) {
          setSuccessMsg('绑定成功，但设置 cname 失败')
        } else {
          setSuccessMsg('绑定成功！由于未找到匹配的 DNS 站点，请手动配置 CNAME 指向 ' + cnameTarget)
        }
      } else {
        if (!matchingZone) {
          throw new Error('missing_zone')
        }
        await window.api.cloudflare.addWorkerDomain(
          config.apiToken,
          config.accountId,
          domainModalTarget.name,
          newDomain,
          zoneId
        )
        setSuccessMsg(
          '域名已作为 Custom Domain 绑定到 Worker！Cloudflare 通常会自动尝试同步 DNS 记录。'
        )
      }

      handleOpenDomainModal(domainModalTarget.type, domainModalTarget.name)
      setNewDomain('')
      fetchResources()
      setTimeout(() => setSuccessMsg(null), 10000)
    } catch (err: any) {
      if (err.message === 'missing_zone') {
        setResourceError('未找到匹配的 Cloudflare 站点。请确保主域名已添加到 Cloudflare。')
        alert('未找到匹配的 Cloudflare 站点。请参考教程添加域名：https://soft.ycz.me/help')
      } else {
        alert(`添加域名失败: ${err.message || '请检查域名格式或权限。'}`)
      }
    } finally {
      setLoadingDomains(false)
    }
  }

  const handleDeleteDomain = async (domainName: string, domainId?: string): Promise<void> => {
    if (!config || !domainModalTarget) return
    if (!confirm(`确定要删除域名 ${domainName} 的绑定吗？`)) return
    
    setLoadingDomains(true)
    try {
      if (domainModalTarget.type === 'page') {
        // Step 1: Remove CNAME if possible
        try {
          const zones = await window.api.cloudflare.getZones(config.apiToken, config.accountId)
          const matchingZone = zones
            .filter((z: any) => domainName.endsWith(z.name))
            .sort((a: any, b: any) => b.name.length - a.name.length)[0]
          
          if (matchingZone) {
            const records = await window.api.cloudflare.getDNSRecords(config.apiToken, matchingZone.id, domainName)
            const cnameRecord = records.find((r: any) => r.type === 'CNAME' && r.name === domainName)
            if (cnameRecord) {
              await window.api.cloudflare.deleteDNSRecord(config.apiToken, matchingZone.id, cnameRecord.id)
            }
          }
        } catch (dnsErr) {
          console.error('Failed to delete CNAME record:', dnsErr)
          // Don't block domain deletion if DNS deletion fails
        }

        await window.api.cloudflare.deletePageDomain(config.apiToken, config.accountId, domainModalTarget.name, domainName)
      } else if (domainId) {
        await window.api.cloudflare.deleteWorkerDomain(config.apiToken, config.accountId, domainId)
      }
      // Refresh
      handleOpenDomainModal(domainModalTarget.type, domainModalTarget.name)
      fetchResources()
    } catch (err: any) {
      alert(`删除域名失败: ${err.message || '请检查权限。'}`)
    } finally {
      setLoadingDomains(false)
    }
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans flex flex-col relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

      <main className="relative z-10 w-full flex-1 overflow-hidden flex flex-col">
        {view === 'initial' && (
          <div className="mx-auto max-w-6xl animate-in fade-in px-8 py-10 duration-700 flex flex-col h-full overflow-hidden w-full">
            {/* Top Tab Navigation */}
            <div className="flex justify-center shrink-0 mb-6">
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-100 inline-flex">
                {[
                  { id: 'deploy', label: '应用部署' },
                  { id: 'frontend', label: '前端应用' },
                  { id: 'backend', label: '后端应用' },
                  { id: 'data', label: '数据管理' },
                  { id: 'history', label: '部署历史' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-0">
              <div className="pb-10">
                {/* Error or No Access Hint */}
                {activeTab !== 'deploy' && activeTab !== 'history' && (!config || resourceError) && (
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center mb-8 animate-in fade-in slide-in-from-bottom-4">
                    <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
                    <h3 className="text-xl font-black text-slate-800 mb-2">获取数据受限</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-md mx-auto mb-8">
                      {resourceError || '请先在下方完成 Cloudflare 基础设施配置，以获取您的资源列表。'}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button 
                        onClick={() => window.api.openExternal('https://soft.ycz.me/help')}
                        className="px-8 py-4 bg-slate-100 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-3"
                      >
                        <ExternalLink size={16} />
                        查看配置教程
                      </button>
                      <button 
                        onClick={fetchResources}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
                      >
                        <RefreshCw size={16} />
                        重新获取
                      </button>
                    </div>
                  </div>
                )}


                {loadingResources && (
                  <div className="py-20 text-center">
                    <RefreshCw className="animate-spin text-primary mx-auto mb-4" size={32} />
                    <p className="text-sm font-bold text-slate-400">正在同步资源数据...</p>
                  </div>
                )}

                {!loadingResources && (
                  <div className="animate-in fade-in duration-500">
                    {/* Backend Apps (Workers) */}
                    {activeTab === 'backend' && config && (
                      <div className="space-y-12">
                        {/* Summary Header */}
                        <div className="flex items-end justify-between px-2">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">后端应用</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">您的 Cloudflare Workers 应用列表</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={fetchResources}
                              className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all"
                            >
                              <RefreshCw size={18} className={loadingResources ? 'animate-spin' : ''} />
                            </button>
                            <div className="text-right">
                              <span className="text-3xl font-black text-slate-900">{resources.workers.length}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase ml-2">个服务活跃</span>
                            </div>
                          </div>
                        </div>

                        {/* Resource Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {resources.workers.map((worker: WorkerService) => {
                            const customDomain = worker.domains?.[0]?.name
                            const defaultDomain = worker.subdomain ? `${worker.id || worker.name}.${worker.subdomain}.workers.dev` : null
                            const displayDomain = customDomain || defaultDomain

                            return (
                              <div key={worker.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between h-full">
                                <div>
                                  <div className="flex items-center gap-4 mb-6">
                                    <div 
                                      className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary shadow-inner cursor-pointer hover:bg-indigo-100 transition-colors"
                                      onClick={() => {
                                        setSelectedWorker({ id: worker.id, name: worker.name })
                                        setIsWorkerModalOpen(true)
                                      }}
                                    >
                                      <Settings size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 
                                        className="text-sm font-black text-slate-900 truncate cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => {
                                          setSelectedWorker({ id: worker.id, name: worker.name })
                                          setIsWorkerModalOpen(true)
                                        }}
                                      >
                                        {worker.id || worker.name}
                                      </h3>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workers 应用</p>
                                    </div>
                                  </div>

                                  {displayDomain && (
                                    <div className="mb-6 px-1">
                                      <button 
                                        onClick={() => window.api.openExternal(`https://${displayDomain}`)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-primary hover:bg-white hover:border-primary/30 transition-all group/link"
                                      >
                                        <Globe size={12} className="text-slate-400 group-hover/link:text-primary transition-colors" />
                                        <span className="text-[11px] font-black truncate max-w-[150px] tracking-tight">{displayDomain}</span>
                                        <ExternalLink size={10} className="text-slate-300 group-hover/link:text-primary transition-colors" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-500`}>
                                    Active
                                  </span>
                                  <button 
                                    onClick={() => handleOpenDomainModal('worker', worker.id || worker.name)}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                  >
                                    域名管理
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Frontend Apps (Pages) */}
                    {activeTab === 'frontend' && config && (
                      <div className="space-y-12">
                        <div className="flex items-end justify-between px-2">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">前端应用</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">您的 Cloudflare Pages 应用列表</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={fetchResources}
                              className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all"
                            >
                              <RefreshCw size={18} className={loadingResources ? 'animate-spin' : ''} />
                            </button>
                            <div className="text-right">
                              <span className="text-3xl font-black text-slate-900">{resources.pages.length}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase ml-2">个项目活跃</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {resources.pages.map((page: PagesProject) => {
                            const customDomain = page.domains?.find((d: any) => !d.name.endsWith('.pages.dev'))?.name
                            const defaultDomain = `${page.name}.pages.dev`
                            const displayDomain = customDomain || defaultDomain

                            return (
                              <div key={page.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between h-full">
                                <div>
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                                      <Zap size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-black text-slate-900 truncate">{page.name}</h3>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pages 应用</p>
                                    </div>
                                  </div>

                                  {displayDomain && (
                                    <div className="mb-6 px-1">
                                      <button 
                                        onClick={() => window.api.openExternal(`https://${displayDomain}`)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-emerald-600 hover:bg-white hover:border-emerald-300/50 transition-all group/link"
                                      >
                                        <Globe size={12} className="text-slate-400 group-hover/link:text-emerald-500 transition-colors" />
                                        <span className="text-[11px] font-black truncate max-w-[150px] tracking-tight">{displayDomain}</span>
                                        <ExternalLink size={10} className="text-slate-300 group-hover/link:text-emerald-500 transition-colors" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                    Active
                                  </span>
                                  <button 
                                    onClick={() => handleOpenDomainModal('page', page.name)}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                  >
                                    域名管理
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Data Stores (D1/R2) */}
                    {activeTab === 'data' && config && (
                      <div className="space-y-16">
                        {/* D1 Databases */}
                        <div>
                          <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">D1 数据库</h2>
                              <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {resources.d1.length} Total
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={fetchResources}
                                className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all"
                              >
                                <RefreshCw size={18} className={loadingResources ? 'animate-spin' : ''} />
                              </button>
                              <button 
                                onClick={handleCreateD1}
                                className="px-5 py-2.5 bg-indigo-50 text-primary border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                              >
                                <Plus size={14} />
                                添加
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.d1.map((db: D1Database) => (
                              <div key={db.uuid} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:border-primary/20">
                                <div 
                                  className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 cursor-pointer hover:bg-indigo-50 hover:text-primary transition-all"
                                  onClick={() => {
                                    setSelectedD1(db)
                                    setIsD1ViewerOpen(true)
                                  }}
                                >
                                  <Database size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 
                                    className="text-[13px] font-black text-slate-800 truncate leading-tight mb-1 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => {
                                      setSelectedD1(db)
                                      setIsD1ViewerOpen(true)
                                    }}
                                  >
                                    {db.name}
                                  </h3>
                                  <p className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter truncate">{db.uuid}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleCopy(db.uuid, db.uuid)}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                      copySuccess === db.uuid 
                                        ? 'bg-emerald-50 text-emerald-500' 
                                        : 'text-slate-300 hover:text-primary hover:bg-slate-50'
                                    }`}
                                    title="复制数据库 ID"
                                  >
                                    {copySuccess === db.uuid ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('确定要删除此数据库吗？')) {
                                        window.api.cloudflare.deleteD1(config!.apiToken, config!.accountId, db.uuid)
                                          .then(() => fetchResources())
                                          .catch((err: any) => alert('删除失败: ' + err.message))
                                      }
                                    }}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* R2 Buckets */}
                        <div>
                          <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">R2 存储桶</h2>
                              <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {resources.r2.length} Total
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={fetchResources}
                                className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all"
                              >
                                <RefreshCw size={18} className={loadingResources ? 'animate-spin' : ''} />
                              </button>
                              <button 
                                onClick={handleCreateR2}
                                className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                              >
                                <Plus size={14} />
                                添加
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.r2.map((bucket: R2Bucket) => (
                              <div key={bucket.name} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:border-primary/20">
                                <div 
                                  className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 cursor-pointer hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                                  onClick={() => {
                                    setSelectedR2(bucket)
                                    setIsR2ViewerOpen(true)
                                  }}
                                >
                                  <Cloud size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 
                                    className="text-[13px] font-black text-slate-800 truncate leading-tight mb-1 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => {
                                      setSelectedR2(bucket)
                                      setIsR2ViewerOpen(true)
                                    }}
                                  >
                                    {bucket.name}
                                  </h3>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">R2 Bucket</p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm('确定要删除此存储桶吗？')) {
                                      window.api.cloudflare.deleteR2(config.apiToken, config.accountId, bucket.name)
                                        .then(() => fetchResources())
                                        .catch((err: any) => alert('删除失败: ' + err.message))
                                    }
                                  }}
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Deployment History */}
                    {activeTab === 'history' && (
                      <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-2">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">部署历史</h2>
                          <button
                            onClick={() => {
                              if (confirm('确定要清空所有历史记录吗？')) {
                                setHistory([])
                                localStorage.removeItem('deploy_history')
                              }
                            }}
                            className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-colors"
                          >
                            清空记录
                          </button>
                        </div>
                        {history.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map((item, index) => (
                              <div
                                key={index}
                                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 relative group"
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'frontend' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-primary'}`}
                                  >
                                    {item.type === 'frontend' ? <Zap size={22} /> : <Settings size={22} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 truncate">
                                      {item.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {item.type === 'frontend' ? 'Pages' : 'Workers'}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                      时间
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-600">
                                      {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.api.openExternal(item.url)
                                    }}
                                    className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                  >
                                    访问地址 <ExternalLink size={10} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHistoryItem(index)}
                                    className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
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
                              <h3 className="text-lg font-black text-slate-900 leading-tight">
                                部署前端页面
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">快速发布您的 HTML/React 项目到 Pages</p>
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
                              <h3 className="text-lg font-black text-slate-900 leading-tight">
                                部署管理后台
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">部署 D1 数据库架构与 Workers API</p>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors" size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Config Footer */}
            <div className="shrink-0 pt-4 flex flex-col items-center">
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
                  <button
                    onClick={() => setIsTokenModalOpen(true)}
                    className="flex items-center gap-2 text-primary hover:text-indigo-700 text-xs font-black transition-colors group"
                  >
                    一键创建令牌
                    <ChevronRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'deploy-frontend' && (
          <div className="flex-1 overflow-hidden h-full">
            <DeployProcess 
              type="frontend" 
              onBack={(tab) => {
                if (tab) setActiveTab(tab as any)
                setView('initial')
              }} 
            />
          </div>
        )}

        {view === 'deploy-backend' && (
          <div className="flex-1 overflow-hidden h-full">
            <DeployProcess 
              type="backend" 
              onBack={(tab) => {
                if (tab) setActiveTab(tab as any)
                setView('initial')
              }} 
            />
          </div>
        )}
      </main>

      {/* Resource Creation Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-900 mb-2">
              新建 {resourceModalType === 'd1' ? 'D1 数据库' : 'R2 存储桶'}
            </h3>
            <p className="text-sm text-slate-400 font-medium mb-6">
              请为您的新资源输入一个唯一的名称。
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  资源名称
                </label>
                <input
                  type="text"
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                  placeholder={`例如: my-dream-${resourceModalType}`}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pointer-events-auto"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsResourceModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmCreateResource}
                  disabled={isCreating || !newResourceName}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                  {isCreating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  立即创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        onDelete={handleDeleteDomain}
        newDomain={newDomain}
        setNewDomain={setNewDomain}
        successMsg={successMsg}
      />
      <D1Viewer
        isOpen={isD1ViewerOpen}
        onClose={() => setIsD1ViewerOpen(false)}
        database={selectedD1}
        config={config}
      />
      <R2Viewer
        isOpen={isR2ViewerOpen}
        onClose={() => setIsR2ViewerOpen(false)}
        bucketName={selectedR2?.name || ''}
        config={config}
      />
      <WorkerConfigModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        worker={selectedWorker}
        config={config}
        resources={resources}
      />
      <CloudflareTokenModal 
        isOpen={isTokenModalOpen} 
        onClose={() => setIsTokenModalOpen(false)} 
        accountId={config?.accountId}
      />
    </div>

  )
}

interface DomainBindingModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'page' | 'worker'
  name: string
  domains: { name: string; id?: string }[]
  loading: boolean
  onAdd: () => Promise<void>
  onDelete: (domainName: string, domainId?: string) => Promise<void>
  newDomain: string
  setNewDomain: (val: string) => void
  successMsg?: string | null
}

const DomainBindingModal: React.FC<DomainBindingModalProps> = ({ 
  isOpen, onClose, type, name, domains, loading, onAdd, onDelete, newDomain, setNewDomain, successMsg 
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

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

          {successMsg && (
            <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shrink-0 shadow-sm border border-indigo-100/50">
                <HelpCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">操作说明</p>
                <p className="text-xs font-bold text-indigo-700 leading-relaxed mb-3">{successMsg}</p>
                <button 
                  onClick={() => window.api.openExternal(HELP_URL)}
                  className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all active:scale-95"
                >
                  查看配置教程
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                已绑定域名 ({domains.length})
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {domains.length > 0 ? (
                  domains.map((d, i) => (
                    <div key={i} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
                      <span className="text-sm font-bold text-slate-700">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => window.api.openExternal(`https://${d.name}`)}>
                          <ExternalLink size={14} className="text-slate-300 hover:text-primary transition-colors cursor-pointer" />
                        </button>
                        <button 
                          onClick={() => onDelete(d.name, d.id)}
                          className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                  ref={inputRef}
                  autoFocus
                  className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all pointer-events-auto"
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
              <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <HelpCircle size={14} className="text-slate-400 mt-0.5" />
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                  绑定域名后，您需要前往 Cloudflare 控制台手动配置 CNAME 或 DNS 解析记录。
                  <button 
                    onClick={() => window.api.openExternal(HELP_URL)}
                    className="text-indigo-500 hover:text-indigo-600 ml-1 font-black underline"
                  >
                    查看教程
                  </button>
                </p>
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
