import React from 'react'
import {
  TrendingUp,
  ExternalLink,
  AlertCircle,
  Search,
  Target,
  Zap,
  ChevronRight
} from 'lucide-react'

interface InsightCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
}

const InsightCard: React.FC<InsightCardProps> = ({ title, value, change, trend }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
    <div className="flex items-end gap-2">
      <h4 className="text-2xl font-black text-slate-900 leading-none">{value}</h4>
      <span
        className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} mb-1`}
      >
        {trend === 'up' ? '↑' : '↓'} {change}
      </span>
    </div>
  </div>
)

const MarketInsights: React.FC<{ subModule: string }> = ({ subModule }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InsightCard title="全球搜索热度" value="1.2M" change="12.5%" trend="up" />
        <InsightCard title="平均转化率" value="3.82%" change="0.4%" trend="up" />
        <InsightCard title="竞品活跃度" value="High" change="5.2%" trend="down" />
        <InsightCard title="AI 推荐指数" value="89/100" change="New" trend="up" />
      </div>

      {subModule === '产品调研' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Search size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                    AI 痛点挖掘分析
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    基于 Amazon 4,200 条评价
                  </p>
                </div>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">
                更新数据
              </button>
            </div>
            <div className="p-8 space-y-6">
              {[
                {
                  tag: '改进点',
                  text: '“产品外壳材质较脆，在低温环境下容易发生断裂”',
                  score: 85,
                  color: 'rose'
                },
                {
                  tag: '优选需求',
                  text: '“用户强烈希望增加快充支持，目前充电时间过长”',
                  score: 72,
                  color: 'amber'
                },
                {
                  tag: '场景痛点',
                  text: '“户外使用时屏幕亮度不足，强光下几乎无法阅读”',
                  score: 94,
                  color: 'indigo'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 group cursor-pointer hover:bg-slate-50/50 p-4 rounded-3xl transition-all -mx-4 border border-transparent hover:border-slate-100"
                >
                  <div
                    className={`shrink-0 w-12 h-12 bg-${item.color}-50 rounded-2xl flex items-center justify-center text-${item.color}-600 font-black text-sm`}
                  >
                    {item.score}%
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest text-${item.color}-500 mb-1 block`}
                    >
                      {item.tag}
                    </span>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{item.text}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-200 group-hover:text-slate-400 self-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/20 blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">深度选品建议</h3>
                <p className="text-indigo-200 text-xs leading-relaxed font-medium">
                  根据当前市场饱和度及用户痛点权重，AI 为您推荐以下优化方向：
                </p>
              </div>

              <div className="space-y-4 flex-1">
                <div className="p-5 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase mb-2 tracking-widest">
                    优先级: P0
                  </p>
                  <h4 className="text-sm font-bold mb-2">定制化户外运动版</h4>
                  <p className="text-[11px] text-white/70">
                    强化外壳耐冲击性，提升峰值亮度至 800 nits。
                  </p>
                </div>
                <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase mb-2 tracking-widest">
                    趋势匹配度: 92%
                  </p>
                  <h4 className="text-sm font-bold mb-2">环保可降解包材</h4>
                  <p className="text-[11px] text-white/70">针对欧洲市场偏好，替换现有吸塑包装。</p>
                </div>
              </div>

              <button className="mt-8 w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all">
                生成详细方案
              </button>
            </div>
          </div>
        </div>
      )}

      {subModule === '竞品分析' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Target size={18} className="text-indigo-500" />
                竞争对手流量监测
              </h3>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                  Last 30 Days
                </span>
              </div>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      竞品域名
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      月访问量
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Top 关键词
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      流量来源
                    </th>
                    <th className="px-8 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    {
                      domain: 'competitor-a.com',
                      traffic: '240K',
                      kw: 'Outdoor Gear',
                      source: 'Search (62%)'
                    },
                    {
                      domain: 'gearpro.io',
                      traffic: '185K',
                      kw: 'Camping Tech',
                      source: 'Social (45%)'
                    },
                    {
                      domain: 'adventure-supply',
                      traffic: '92K',
                      kw: 'Hiking Kits',
                      source: 'Direct (38%)'
                    }
                  ].map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 font-bold text-sm text-slate-700">{item.domain}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{item.traffic}</span>
                          <span className="text-[10px] text-emerald-500 font-bold">+12%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
                          {item.kw}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs font-medium text-slate-500">
                        {item.source}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subModule === '趋势预测' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-slate-800">全球品类热度趋势</h3>
              <TrendingUp size={18} className="text-indigo-500" />
            </div>
            <div className="h-64 flex items-end gap-2 px-2">
              {[40, 65, 45, 90, 85, 60, 75, 55, 95, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-50/50 rounded-t-xl relative group cursor-pointer hover:bg-slate-50"
                >
                  <div
                    className="absolute bottom-0 inset-x-0 bg-indigo-500 rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-indigo-600"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded hidden group-hover:block">
                      {h}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between px-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Mar 2024</span>
              <span>Dec 2024</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Zap size={20} />
                </div>
                <h3 className="text-sm font-bold text-emerald-900 tracking-tight">
                  AI 爆款预测因子
                </h3>
              </div>
              <p className="text-xs text-emerald-700/80 mb-6 font-medium leading-relaxed">
                结合区域气候变化、社交媒体情绪值及搜索增量，识别出以下潜在高转化因子：
              </p>
              <div className="flex flex-wrap gap-2">
                {['轻便折叠', '长效续航', '跨界联名', '极致静音', 'AI 助手集成'].map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-white rounded-2xl text-[10px] font-bold text-emerald-700 shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200/50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                关键风险提示
              </h3>
              <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">运费波动预警</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    红海航线持续不确定性，预计 4 月物流成本上浮 15%-25%。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketInsights
