import React from 'react';
import { BarChart3, Layers, Rocket, Settings2, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  projectInfo?: { name: string; url: string };
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, projectInfo }) => {
  const modules = [
    { id: 'insights', label: '市场洞察', icon: BarChart3, description: '趋势预测与竞品分析' },
    { id: 'sites', label: '站点集群', icon: Layers, description: '智能建站与自动部署' },
    { id: 'traffic', label: '全网获客', icon: Rocket, description: '内容工厂与全域引流' },
    { id: 'settings', label: '系统设置', icon: Settings2, description: 'API 配置与偏好设置' },
  ];

  return (
    <div className="w-64 bg-slate-900 flex flex-col h-full shadow-2xl z-40 relative group/sidebar">
      {/* Glow Effect */}
      <div className="absolute top-0 -left-64 w-64 h-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      
      {/* Project Info Section */}
      <div className="p-6 text-left">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">当前工作空间</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate leading-tight">{projectInfo?.name || 'Default Project'}</h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer group/link mt-0.5">
                <span className="truncate max-w-[80px] text-left">{projectInfo?.url || 'workspace-01'}</span>
                <ExternalLink size={10} className="shrink-0 transition-transform group-hover/link:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Modules */}
      <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto custom-scrollbar text-left">
        <div className="px-3 mb-3">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">核心引擎</p>
        </div>
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className={cn(
              "w-full flex flex-col gap-1 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden text-left",
              activeModule === module.id 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
                <module.icon size={18} className={cn(
                  "transition-all duration-500",
                  activeModule === module.id ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-400"
                )} />
                <span className="font-bold text-sm tracking-wide">{module.label}</span>
            </div>
            <div className="ml-7">
               <p className={cn(
                 "text-[10px] transition-all duration-500",
                 activeModule === module.id ? "text-indigo-100/70" : "text-slate-500 group-hover:text-slate-400"
               )}>
                 {module.description}
               </p>
            </div>
            
            {activeModule === module.id && (
                <div className="absolute inset-y-0 left-0 w-1 bg-white rounded-full my-4 ml-1" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-6 mt-auto text-left">
        <div className="bg-indigo-950/30 rounded-2xl p-4 border border-indigo-500/10 mb-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase">AI 算力状态</span>
                <span className="text-[10px] text-emerald-500 font-bold">100%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500/50" />
            </div>
        </div>
        
        <div className="flex items-center gap-3 text-[10px] bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="relative">
             <div className="w-2 h-2 bg-emerald-500 rounded-full" />
             <div className="w-2 h-2 bg-emerald-500 rounded-full absolute inset-0 animate-ping" />
          </div>
          <div className="flex flex-col">
             <span className="text-slate-300 font-bold leading-tight uppercase">系统平稳运行</span>
             <span className="text-slate-500 mt-0.5">Node: v20.11.0</span>
          </div>
          <Zap size={14} className="ml-auto text-amber-500" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
