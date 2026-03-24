import React, { useState, useEffect } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  ChevronRight,
  Filter,
  Download,
  Plus,
  LayoutGrid,
  Search,
  BarChart2,
  Zap
} from 'lucide-react'
import MarketInsights from '../Modules/MarketInsights'
import SiteClusters from '../Modules/SiteClusters'
import TrafficAcquisition from '../Modules/TrafficAcquisition'
import Settings from '../Modules/Settings'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MainContentProps {
  activeModule: string
}

const MainContent: React.FC<MainContentProps> = ({ activeModule }) => {
  const subModulesMap: Record<string, string[]> = {
    insights: ['产品调研', '竞品分析', '趋势预测'],
    sites: ['智能建站', '内容生成', '自动化部署'],
    traffic: ['内容工厂', '社交管理', 'CRM管理'],
    settings: ['系统状态', 'API 配置', '通用设置']
  }

  const moduleLabels: Record<string, string> = {
    insights: '市场洞察',
    sites: '站点集群',
    traffic: '全网获客',
    settings: '系统设置'
  }

  const [activeSubModule, setActiveSubModule] = useState(subModulesMap[activeModule]?.[0] || '')

  useEffect(() => {
    const defaultSub = subModulesMap[activeModule]?.[0] || ''
    if (activeSubModule !== defaultSub) {
      setActiveSubModule(defaultSub)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule])

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'insights':
        return <MarketInsights subModule={activeSubModule} />
      case 'sites':
        return <SiteClusters subModule={activeSubModule} />
      case 'traffic':
        return <TrafficAcquisition subModule={activeSubModule} />
      case 'settings':
        return <Settings subModule={activeSubModule} />
      default:
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <LayoutGrid size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">正在准备模块内容</h4>
            <div className="mt-8 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />

      <div className="h-16 bg-white/60 backdrop-blur-md border-b border-slate-200/60 flex items-center px-8 justify-between z-10">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {subModulesMap[activeModule]?.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubModule(sub)}
              className={cn(
                'px-4 py-2 text-xs font-bold transition-all duration-300 rounded-lg',
                activeSubModule === sub
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
            />
            <input
              type="text"
              placeholder="搜索数据..."
              className="pl-9 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all w-48"
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-slate-200">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar relative z-0">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-end pb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  {moduleLabels[activeModule]}
                </span>
                <ChevronRight size={12} className="text-slate-300" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {activeSubModule}
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeSubModule}
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl font-medium">
                利用 AI 深度分析全球外贸趋势，为您提供精准的产品调研及竞品监控数据。
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <Download size={14} /> 导出报表
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
                <Plus size={14} /> 新增任务
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group cursor-pointer transition-transform duration-500 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Zap size={24} className="text-amber-400" />
                  </div>
                  <LayoutGrid size={20} className="text-white/30" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">AI 深度洞察</h3>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    基于 LLM 模型，自动挖掘用户痛点，生成高转化选品及建站策略。
                  </p>
                </div>
              </div>
            </div>

            {[
              { label: '活跃运行', value: '12', icon: BarChart2, color: 'indigo' },
              { label: '待处理任务', value: '05', icon: Search, color: 'emerald' }
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-[2.5rem] p-8 border border-indigo-50 shadow-sm card-hover flex flex-col justify-between"
              >
                <div
                  className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-600`}
                >
                  <stat.icon size={22} />
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 mb-1 leading-none">
                    {stat.value}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 transition-all duration-500">{renderModuleContent()}</div>
        </div>
      </main>
    </div>
  )
}

export default MainContent
