import React from 'react';
import { Instagram, MessageSquare, Database, Users, Video, Image as ImageIcon, CheckCircle2, Send, Star, UserCheck, Zap, Plus } from 'lucide-react';

const TrafficAcquisition: React.FC<{ subModule: string }> = ({ subModule }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '社交媒体账号', value: '18', icon: Users, color: 'indigo' },
          { label: '今日生成任务', value: '45', icon: Zap, color: 'amber' },
          { label: '平均互动率', value: '5.2%', icon: Star, color: 'rose' },
          { label: '潜在客户 (CRM)', value: '1,280', icon: Database, color: 'indigo' }
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

      {subModule === '内容工厂' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                 <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       <Video size={18} className="text-indigo-500" />
                       AI 视觉生成实验室
                    </h3>
                    <div className="flex gap-2">
                       <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-100">批量生成</button>
                    </div>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { icon: Instagram, label: '小红书种草图文', desc: '氛围感 AI 构图' },
                      { icon: Video, label: 'TikTok 短视频', desc: 'AI 配音与脚本' },
                      { icon: ImageIcon, label: 'Pinterest 瀑布流', desc: '高饱和度产品图' }
                    ].map((type, i) => (
                      <div key={i} className="group p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer text-center">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                            <type.icon size={24} />
                         </div>
                         <h4 className="text-xs font-bold text-slate-800 mb-1">{type.label}</h4>
                         <p className="text-[10px] text-slate-400 font-medium">{type.desc}</p>
                      </div>
                    ))}
                 </div>
                 <div className="px-8 pb-8">
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                       <div className="flex items-center justify-between mb-4 relative z-10">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">正在渲染中</h4>
                          <span className="text-[10px] font-bold">12 / 100</span>
                       </div>
                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
                          <div className="h-full w-[12%] bg-indigo-500 animate-pulse" />
                       </div>
                       <p className="mt-4 text-[10px] text-white/50 relative z-10">视频渲染涉及服务器 GPU 资源，预计还需 1.5 小时...</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/20 blur-[60px] -mr-16 -mt-16" />
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-indigo-300" />
                    AI 智能扩图/补图
                 </h3>
                 <div className="aspect-square bg-white/10 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 relative group overflow-hidden">
                    <Plus size={32} className="text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    <p className="absolute bottom-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">点击或拖拽上传</p>
                 </div>
                 <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">一键生成全域适配</button>
              </div>
           </div>
        </div>
      )}

      {subModule === '社交管理' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Users size={18} className="text-indigo-500" />
                 多账号工作空间
              </h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                 添加账号
              </button>
           </div>
           <div className="p-0">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50">
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">目标平台</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">账号 ID</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">今日发布</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">互动量</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">状态</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {[
                      { platform: 'Instagram', id: '@outdoor_pro', posts: 12, reach: '4.2K', status: 'Active' },
                      { platform: 'Pinterest', id: 'CampingLife', posts: 24, reach: '1.8K', status: 'Active' },
                      { platform: 'TikTok', id: 'GlobalTradeOS', posts: 3, reach: '12K', status: 'Review Needed' }
                    ].map((acc, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{acc.platform}</span>
                         </td>
                         <td className="px-8 py-6 font-bold text-sm text-slate-700">{acc.id}</td>
                         <td className="px-8 py-6 text-sm font-black text-slate-900">{acc.posts}</td>
                         <td className="px-8 py-6 text-sm font-medium text-slate-500">{acc.reach}</td>
                         <td className="px-8 py-6">
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold ${acc.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${acc.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                               {acc.status}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {subModule === 'CRM管理' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-500" />
                    AI 询盘自动回复预览
                 </h3>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">模拟真实人类语气</span>
              </div>
              <div className="space-y-4">
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">客户提问: "How soon do you ship to Germany?"</p>
                    <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-200" />
                       <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 relative shadow-sm">
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">
                             "Hi there! We usually process orders within 24 hours. Shipping to Germany typically takes 5-7 business days via DHL. Would you like a shipping estimate for a specific product?"
                          </p>
                          <div className="absolute top-2 right-4 flex gap-1">
                             <CheckCircle2 size={12} className="text-emerald-500" />
                             <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">AI Verified</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <button className="mt-8 group flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-800">
                 配置自动回复库 <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2">
                 <UserCheck size={18} className="text-emerald-500" />
                 意向客户线索
              </h3>
              <div className="space-y-4 flex-1">
                 {[
                   { name: 'Marcus Weber', country: 'DE', intent: 'High', activity: 'Inquired about OEM' },
                   { name: 'Sarah Jenkins', country: 'UK', intent: 'Medium', activity: 'Visited checkout 2x' },
                   { name: 'Yuki Tanaka', country: 'JP', intent: 'Low', activity: 'Downloaded catalog' }
                 ].map((lead, i) => (
                   <div key={i} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs text-slate-400">
                            {lead.country}
                         </div>
                         <div>
                            <h4 className="text-xs font-bold text-slate-800">{lead.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{lead.activity}</p>
                         </div>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg ${
                        lead.intent === 'High' ? 'bg-emerald-50 text-emerald-600' :
                        lead.intent === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>{lead.intent} Intent</span>
                   </div>
                 ))}
              </div>
              <button className="mt-8 w-full py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">同步至企业微信/飞书</button>
           </div>
        </div>
      )}

    </div>
  );
};


export default TrafficAcquisition;
