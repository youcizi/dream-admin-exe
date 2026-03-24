import React from 'react';
import { Layout, FileText, Share2, Server, CheckCircle2, Clock, Globe, Zap, ArrowRight, Shield } from 'lucide-react';

const SiteClusters: React.FC<{ subModule: string }> = ({ subModule }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '在线站点', value: '24', icon: Globe, color: 'indigo' },
          { label: '本月生成文章', value: '142', icon: FileText, color: 'emerald' },
          { label: '部署成功率', value: '99.8%', icon: CheckCircle2, color: 'amber' },
          { label: 'CDN 加速节点', value: '280+', icon: Zap, color: 'indigo' }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-600`}>
               <stat.icon size={22} />
            </div>
            <div>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
               <h4 className="text-xl font-black text-slate-900 leading-tight">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {subModule === '智能建站' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layout size={18} className="text-indigo-500" />
                    Headless 架构模板
                 </h3>
                 <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600">浏览全库</button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { name: 'Aurora High-Converting', tech: 'Next.js + Tailwind', type: '电商/落地页' },
                   { name: 'Quantum Minimalist', tech: 'Astro + Vanilla CSS', type: '品牌/博客' }
                 ].map((tmpl, i) => (
                   <div key={i} className="group relative rounded-[2rem] border border-slate-100 overflow-hidden cursor-pointer hover:border-indigo-200 transition-all">
                      <div className="aspect-video bg-slate-50 relative overflow-hidden flex items-center justify-center">
                         <Layout size={48} className="text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                         <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-all flex items-center justify-center">
                            <button className="opacity-0 group-hover:opacity-100 px-6 py-2 bg-white text-indigo-900 rounded-full text-[10px] font-black uppercase tracking-widest transition-all translate-y-4 group-hover:translate-y-0">预览模板</button>
                         </div>
                      </div>
                      <div className="p-5">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-slate-800">{tmpl.name}</h4>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">{tmpl.tech}</span>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tmpl.type}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-amber-400" />
                    极速建站向导
                 </h3>
                 <div className="space-y-6">
                    {[
                      { step: '01', title: '录入产品关键词', status: 'done' },
                      { step: '02', title: 'AI 生成文案与图片', status: 'current' },
                      { step: '03', title: '自动化 SEO 矩阵', status: 'waiting' }
                    ].map(item => (
                      <div key={item.step} className="flex gap-4 items-center">
                         <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                           item.status === 'done' ? 'bg-indigo-500 border-indigo-500 text-white' : 
                           item.status === 'current' ? 'border-amber-500 text-amber-500 animate-pulse' : 
                           'border-slate-700 text-slate-700'
                         }`}>
                            {item.status === 'done' ? <CheckCircle2 size={14} /> : item.step}
                         </div>
                         <span className={`text-xs font-bold ${item.status === 'waiting' ? 'text-slate-600' : 'text-slate-200'}`}>{item.title}</span>
                      </div>
                    ))}
                 </div>
                 <button className="mt-8 w-full py-4 premium-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">立即开始 (AI Cluster Mode)</button>
              </div>
           </div>
        </div>
      )}

      {subModule === '内容生成' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <FileText size={18} className="text-indigo-500" />
                 内容任务队列
              </h3>
              <div className="flex gap-2">
                 <button className="p-2 text-slate-400 hover:text-indigo-600"><Clock size={16} /></button>
                 <button className="p-2 text-slate-400 hover:text-indigo-600"><Server size={16} /></button>
              </div>
           </div>
           <div className="p-0">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50">
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">任务名称</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">类型</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">进度</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">状态</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {[
                      { name: '2024 夏季选品 SEO 矩阵文章 (50篇)', type: 'GEO/SEO Content', progress: 65, status: 'In Progress' },
                      { name: '产品详细描述批量重写', type: 'Product Copy', progress: 100, status: 'Completed' },
                      { name: '长尾关键词博客系列 (20篇)', type: 'Blog Post', progress: 12, status: 'In Progress' }
                    ].map((task, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-6 font-bold text-sm text-slate-700">{task.name}</td>
                         <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">{task.type}</span>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="flex-1 min-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${task.progress}%` }} 
                                  />
                               </div>
                               <span className="text-[10px] font-black text-slate-400">{task.progress}%</span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold ${task.status === 'Completed' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`} />
                               {task.status}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {subModule === '自动化部署' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 group-hover:w-48 group-hover:h-48 transition-all duration-700 rounded-full -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Server size={18} className="text-indigo-500" />
                    Cloudflare Pages 状态
                 </h3>
                 <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Operational
                 </span>
              </div>
              <div className="space-y-4">
                 {[
                   { site: 'main-store-prod', url: 'shop.tradeos.com', time: '2m ago' },
                   { site: 'landing-page-v2', url: 'offer.tradeos.com', time: '1h ago' },
                   { site: 'blog-hub', url: 'blog.tradeos.com', time: 'Yesterday' }
                 ].map((proj, i) => (
                   <div key={i} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <Globe size={14} />
                         </div>
                         <div>
                            <h4 className="text-xs font-bold text-slate-800">{proj.site}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{proj.url}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-widest">{proj.time}</div>
                         <button className="text-[10px] font-black text-indigo-600 hover:underline">LOGS</button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 flex flex-col h-full">
                 <div className="mb-8">
                    <Shield size={32} className="text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">全链路安全防护</h3>
                    <p className="text-emerald-200 text-xs leading-relaxed font-medium">
                       所有站点自动配置 Cloudflare SSL/TLS 证书，集成 WAF 防火墙机制，确保全球访问速度与数据安全。
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="p-4 bg-white/10 rounded-2xl">
                       <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1">SSL 证书</p>
                       <p className="text-xs font-bold">Auto Managed</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl">
                       <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1">DDoS 防护</p>
                       <p className="text-xs font-bold">Always On</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl">
                       <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1">CDN 缓存</p>
                       <p className="text-xs font-bold">Tier 1 Cache</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl">
                       <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1">SEO 渲染</p>
                       <p className="text-xs font-bold">Edge SSR</p>
                    </div>
                 </div>
                 
                 <button className="mt-8 group flex items-center justify-center gap-2 px-6 py-4 bg-white text-emerald-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                    管理所有配置 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SiteClusters;
