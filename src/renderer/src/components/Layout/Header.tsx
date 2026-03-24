import React, { useState } from 'react';
import { Settings, User, ChevronDown, Info, HelpCircle, Mail, LogOut, Edit3, Eye, Globe, Zap, Cpu, Activity, Rocket } from 'lucide-react'

const Header: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <header className="h-14 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-50 relative">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          <Globe size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 tracking-tight text-lg leading-none">Global Trade OS</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">全球贸易增长引擎</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Activity size={14} className="text-emerald-500" />
            <span>IP: 104.21.78.122</span>
         </div>
         <div className="w-px h-3 bg-slate-200" />
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Zap size={14} className="text-amber-500" />
            <span>Balance: <span className="text-slate-700">$20.70</span></span>
         </div>
         <div className="w-px h-3 bg-slate-200" />
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Cpu size={14} className="text-indigo-500" />
            <span>AI Status: <span className="text-emerald-500">Ready</span></span>
         </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Settings Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${activeMenu === 'settings' ? 'bg-indigo-50 text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Settings size={18} />
            <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'settings' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'settings' && (
            <>
              <div className="fixed inset-0" onClick={() => setActiveMenu(null)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                <div className="px-4 py-2 mb-1 border-b border-slate-50">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">系统管理</p>
                </div>
                <button 
                  onClick={() => window.api.openDeploy()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-primary transition-colors"
                >
                  <Rocket size={16} /> 应用部署
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-primary transition-colors">
                  <Settings size={16} /> 全局配置
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-primary transition-colors">
                  <HelpCircle size={16} /> 常见问题
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-primary transition-colors border-t border-slate-50 mt-1 pt-3">
                  <Mail size={16} /> 反馈建议
                </button>
              </div>
            </>
          )}
        </div>

        {/* My Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('me')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeMenu === 'me' ? 'bg-indigo-50 text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 overflow-hidden">
               <User size={14} />
            </div>
            <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'me' ? 'rotate-180' : ''}`} />
          </button>

          {activeMenu === 'me' && (
            <>
              <div className="fixed inset-0" onClick={() => setActiveMenu(null)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                <div className="px-4 py-2 mb-1 border-b border-slate-50 flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-primary font-bold text-xs">Admin</div>
                   <div>
                      <p className="text-xs font-bold text-slate-800">超级管理员</p>
                      <p className="text-[10px] text-slate-400">admin@tradeos.com</p>
                   </div>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-primary transition-colors">
                  <Eye size={16} /> 个人中心
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-primary transition-colors">
                  <Edit3 size={16} /> 修改资料
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-50 mt-1 pt-3">
                  <LogOut size={16} /> 退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
