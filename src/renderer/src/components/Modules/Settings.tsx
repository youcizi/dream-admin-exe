import React from 'react';
import { Settings as SettingsIcon, Key, Database, Bell, Shield, Globe, Cpu, Activity, Save, RefreshCw, AlertTriangle } from 'lucide-react';

const Settings: React.FC<{ subModule: string }> = ({ subModule }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {subModule === '系统状态' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       <Activity size={18} className="text-indigo-500" />
                       后端服务实时负载
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Node.js / Hono Engine</span>
                 </div>
                 
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-slate-600">CPU 使用率</span>
                          <span className="text-xs font-black text-slate-900">24%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-[24%] bg-indigo-500 rounded-full" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-slate-600">内存占用 (RSS)</span>
                          <span className="text-xs font-black text-slate-900">412MB / 1024MB</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-[40%] bg-indigo-500 rounded-full" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-slate-600">D1 数据库连接数</span>
                          <span className="text-xs font-black text-slate-900">Active (12)</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full w-[15%] bg-emerald-500 rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200/60 p-8">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">本地环境信息</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'OS Version', value: 'Windows 10 Pro' },
                      { label: 'Electron', value: 'v28.2.0' },
                      { label: 'Node.js', value: 'v20.11.1' },
                      { label: 'Architecture', value: 'x64' }
                    ].map(item => (
                      <div key={item.label} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                         <p className="text-xs font-bold text-slate-800 tracking-tight">{item.value}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Cpu size={20} className="text-indigo-300" />
                    AI 模型计算状态
                 </h3>
                 <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl border border-white/10 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <div>
                       <h4 className="text-xs font-bold">GPT-4 Turbo</h4>
                       <p className="text-[10px] text-white/50">响应延迟: 840ms</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center opacity-50">
                       <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    </div>
                    <div>
                       <h4 className="text-xs font-bold text-white/50">Claude 3.5 Sonnet</h4>
                       <p className="text-[10px] text-white/30">离线 / 未配置</p>
                    </div>
                 </div>
                 <button className="mt-8 w-full py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">刷新状态</button>
              </div>
           </div>
        </div>
      )}

      {subModule === 'API 配置' && (
        <div className="max-w-4xl space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-slate-800">第三方服务集成</h3>
                 <Key size={18} className="text-indigo-500" />
              </div>
              
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">OpenAI API Key</label>
                       <div className="relative">
                          <input 
                            type="password" 
                            defaultValue="••••••••••••••••" 
                            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-mono"
                          />
                          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"><RefreshCw size={14} /></button>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Claude (Anthropic) Key</label>
                       <input 
                          type="password" 
                          placeholder="未配置" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cloudflare API Token</label>
                       <input 
                         type="password" 
                         defaultValue="••••••••••••••••" 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all"
                       />
                    </div>
                    <div className="space-y-4 pt-6">
                       <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                             API 密钥将加密存储在本地 SQLite 数据库中。我们绝不会将密钥上传到任何非官方服务器。
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-12 flex justify-end gap-3 border-t border-slate-50 pt-8">
                 <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all">重置更改</button>
                 <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                    <Save size={14} /> 保存配置
                 </button>
              </div>
           </div>
        </div>
      )}

      {subModule === '通用设置' && (
        <div className="max-w-4xl space-y-6">
           {[
             { title: '多语言集成', desc: '目前已启用 English (US) 和 简体中文。', icon: Globe },
             { title: '安全与隐私', desc: '两步验证、登录日志及数据导出权限管理。', icon: Shield },
             { title: '全局通知', desc: '桌面弹窗提示任务完成进度及错误告警。', icon: Bell }
           ].map((opt, i) => (
             <div key={i} className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                      <opt.icon size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{opt.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{opt.desc}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-6 bg-slate-200 rounded-full relative transition-colors group-hover:bg-indigo-200">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

    </div>
  );
};

export default Settings;
