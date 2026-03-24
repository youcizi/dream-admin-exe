import React from 'react'
import { Settings, Cloud, Zap, Shield, Box, Layout } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const DeploySidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'settings', label: '基础设置', icon: Settings, desc: 'CF 账号与密钥' },
    { id: 'projects', label: '应用列表', icon: Box, desc: '已部署的应用' },
    { id: 'deployments', label: '部署历史', icon: Zap, desc: '最近的发布记录' },
    { id: 'dns', label: '域名管理', icon: Cloud, desc: 'DNS 解析与中转' },
    { id: 'security', label: '安全防护', icon: Shield, desc: 'WAF 与限流配置' },
  ]

  return (
    <div className="w-72 bg-slate-900 flex flex-col h-full shadow-2xl z-40 relative">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
              <Layout size={22} />
           </div>
           <div>
              <h2 className="text-lg font-bold text-white tracking-tight">部署中心</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">App Deployment</p>
           </div>
        </div>
        
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 mb-3">核心管理</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} />
              <div className="text-left">
                <p className="text-sm font-bold">{item.label}</p>
                <p className={`text-[10px] ${activeTab === item.id ? 'text-indigo-100/70' : 'text-slate-500'}`}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-8 pt-4">
         <div className="bg-indigo-950/40 rounded-2xl p-4 border border-indigo-500/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Wrangler 服务状态</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">系统已准备就绪，随时可以进行应用发布。</p>
         </div>
      </div>
    </div>
  )
}

export default DeploySidebar
