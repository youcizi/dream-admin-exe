import React, { useState } from 'react'
import {
  ExternalLink, CheckCircle2, AlertTriangle, Info,
  ChevronRight, ArrowRight, Shield, X, Globe
} from 'lucide-react'

interface CloudflareTokenModalProps {
  isOpen: boolean
  onClose: () => void
  accountId?: string
}

const CloudflareTokenModal: React.FC<CloudflareTokenModalProps> = ({ isOpen, onClose, accountId }) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [r2Activated, setR2Activated] = useState(false)

  if (!isOpen) return null

  // Ensure accountId is handled correctly in links
  const formattedAccountId = accountId || ':account'

  const r2Url = `https://dash.cloudflare.com/?to=/:account/r2/plans`
  const tokenUrl = `https://dash.cloudflare.com/?to=/:account/api-tokens&permissionGroupKeys=[{"key":"zone","type":"read"},{"key":"account_dns_settings","type":"edit"},{"key":"zone_dns_settings","type":"edit"},{"key":"page","type":"edit"},{"key":"workers_scripts","type":"edit"},{"key":"workers_kv","type":"edit"},{"key":"workers_r2","type":"edit"},{"key":"workers_routes","type":"edit"},{"key":"d1","type":"edit"},{"key":"workers_r2_storage","type":"edit"},{"key":"workers_kv_storage","type":"edit"},{"key":"workers_ci","type":"edit"},{"key":"zone_access","type":"revoke"}]&name=dream-admin`

  const handleOpenExternal = (url: string): void => {
    window.api.openExternal(url)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">一键创建令牌</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Cloudflare 账户配置指引
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {step === 1 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Globe size={32} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">请先登录您的账户</h4>
                <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                  我们需要您先在默认浏览器中登录 Cloudflare 控制台，以便后续一键构建令牌。
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleOpenExternal('https://dash.cloudflare.com')}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <ExternalLink size={18} />
                  点击前往登录
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  已完成登录，下一步
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-6">
                {/* Step 1: R2 */}
                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                      <Info size={18} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-900 mb-1">1. 开通 R2 存储服务</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        账户需要先开通 R2 存储才能正常使用存储功能。如果您尚未开通，请先点击链接完成订阅。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => handleOpenExternal(r2Url)}
                      className="px-6 py-3 bg-white border border-slate-200 text-primary rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-primary/30 transition-all flex items-center gap-2"
                    >
                      点击去开通
                      <ExternalLink size={14} />
                    </button>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${r2Activated ? 'bg-primary border-primary' : 'bg-white border-slate-200 group-hover:border-primary/50'}`}
                        onClick={() => setR2Activated(!r2Activated)}
                      >
                        {r2Activated && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">已开通</span>
                    </label>
                  </div>
                </div>

                {/* Step 2: One-click Token */}
                <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100/50 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <ArrowRight size={18} />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 mb-1">2. 一键构建账户令牌</h5>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          点击下方按钮将在 Cloudflare 中为您预填好令牌权限。
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenExternal(tokenUrl)}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 mb-4"
                    >
                      一键构建令牌
                      <ExternalLink size={16} />
                    </button>

                    <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 flex gap-3 items-start">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[10px] font-bold text-slate-600 leading-normal">
                        <span className="text-slate-900 font-black">重要设置：</span>
                        在“区域资源”选项中，请务必选择 <span className="text-primary italic">“包括 - 账户的所有区域 - [您的账户名称]&apos;s Account”</span>。
                      </div>
                    </div>

                  </div>
                </div>

                {/* Step 3: Persistence Reminder */}
                <div className="px-6 py-4 flex gap-4 items-center bg-slate-50 border border-slate-100 rounded-2xl">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-500 leading-normal">
                    创建成功后，请 <span className="text-slate-900 font-black">务必保存令牌</span>。令牌仅展示一次，若遗忘则需要重新创建。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
          >
            返回填写配置
          </button>
        </div>
      </div>
    </div>
  )
}

export default CloudflareTokenModal
