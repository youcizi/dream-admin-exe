import React from 'react'
import { Plus, Globe, Zap, Target, ArrowRight } from 'lucide-react'

interface EmptyHomeProps {
  onAddProject: () => void
}

const EmptyHome: React.FC<EmptyHomeProps> = ({ onAddProject }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full" />

      <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Zap size={12} fill="currentColor" /> AI Powered Global Trade
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
            初始化您的
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">
              全球贸易引擎
            </span>
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed">
            连接您的 Headless 站点后台，开启从选品、建站到全网获客的 AI 自动化之旅。
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onAddProject}
            className="group relative inline-flex items-center gap-4 px-10 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-900/20 transition-all hover:-translate-y-1 hover:bg-slate-800 active:scale-95"
          >
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center transition-all group-hover:bg-indigo-500 group-hover:rotate-90">
              <Plus size={24} />
            </div>
            <span>新建贸易项目</span>

            {/* Subtle button glow */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>

          <button
            onClick={() => window.api.openDeploy()}
            className="group flex items-center gap-2 px-4 py-2 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-indigo-100/50"
          >
            还没有项目？点击部署应用{' '}
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          {[
            { icon: Target, label: '市场洞察', desc: 'AI 深度分析' },
            { icon: Globe, label: '站点集群', desc: '自动化部署' },
            { icon: Zap, label: '全网获客', desc: '内容工厂' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400">
                <item.icon size={18} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-[8px] text-slate-400 font-bold uppercase">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmptyHome
