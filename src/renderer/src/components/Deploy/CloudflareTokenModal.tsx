import React, { useState } from 'react'
import {
  ExternalLink, CheckCircle2, AlertTriangle, Info,
  ChevronRight, Shield, X, Globe
} from 'lucide-react'

interface CloudflareTokenModalProps {
  isOpen: boolean
  onClose: () => void
  accountId?: string
}

const CloudflareTokenModal: React.FC<CloudflareTokenModalProps> = ({ isOpen, onClose, accountId }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [r2Activated, setR2Activated] = useState(false)
  const [hasFinishedLogin, setHasFinishedLogin] = useState(false)

  if (!isOpen) return null

  // Ensure accountId is handled correctly in links
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formattedAccountId = accountId || ':account'

  const r2Url = `https://dash.cloudflare.com/?to=/:account/r2/plans`
  const tokenUrl = `https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=[{"key":"zone","type":"read"},{"key":"account_dns_settings","type":"edit"},{"key":"zone_dns_settings","type":"edit"},{"key":"page","type":"edit"},{"key":"workers_scripts","type":"edit"},{"key":"workers_kv","type":"edit"},{"key":"workers_r2","type":"edit"},{"key":"workers_routes","type":"edit"},{"key":"d1","type":"edit"},{"key":"workers_r2_storage","type":"edit"},{"key":"workers_kv_storage","type":"edit"},{"key":"workers_ci","type":"edit"},{"key":"zone_access","type":"revoke"}]&name=dream-admin`

  const handleOpenExternal = (url: string): void => {
    window.api.openExternal(url)
  }

  const steps = [
    { id: 1, label: '登录账户' },
    { id: 2, label: '开通 R2' },
    { id: 3, label: '构建令牌' }
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* Step Navigation - Floating Top Right */}
        <div className="absolute top-20 right-8 flex flex-col items-center gap-1 z-20">
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id as any)}
                title={s.label}
                className={`group flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${step === s.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${step === s.id
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                  : step > s.id
                    ? 'border-primary/30 bg-primary/5 text-primary'
                    : 'border-slate-100 bg-slate-50 text-slate-300'
                  }`}>
                  {s.id}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity ${step === s.id ? 'opacity-100' : ''
                  }`}>
                  {s.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-[2px] h-3 bg-slate-100 rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>

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
        <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-6">
                <h4 className="text-2xl font-black text-slate-900 mb-2">1. 请先登录您的账户</h4>
                <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                  我们需要您先在默认浏览器中登录 Cloudflare 控制台，以便进入后续步骤。
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-center">
                  <button
                    onClick={() => setHasFinishedLogin(!hasFinishedLogin)}
                    className="flex items-center gap-3 group py-2"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${hasFinishedLogin ? 'bg-primary border-primary' : 'bg-white border-slate-200 group-hover:border-primary/50'}`}
                    >
                      {hasFinishedLogin && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">我已完成登录</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (hasFinishedLogin) {
                      setStep(2)
                    } else {
                      handleOpenExternal('https://dash.cloudflare.com')
                    }
                  }}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${hasFinishedLogin
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-indigo-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {hasFinishedLogin ? (
                    <>
                      继续下一步
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      <ExternalLink size={18} />
                      点击前往登录
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-6">
                <h4 className="text-2xl font-black text-slate-900 mb-2">2. 开通 R2 存储服务</h4>
                <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mb-4">
                  账户需要先开通 R2 存储才能正常使用存储功能。建议查看教程确认步骤。
                  <a
                    onClick={() => handleOpenExternal('https://soft.ycz.me/help')}
                    className="text-xs font-black text-primary uppercase tracking-widest hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-full"
                  >
                    查看配置教程 <ExternalLink size={12} />
                  </a>
                </p>

              </div>

              <div className="rounded-[2.5rem] px-8 pb-8">
                <button
                  onClick={() => handleOpenExternal(r2Url)}
                  className="w-full py-4 bg-white border border-slate-200 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary/30 transition-all flex items-center justify-center gap-2 mb-8 shadow-sm"
                >
                  点击去 Cloudflare 开通
                  <ExternalLink size={16} />
                </button>

                <div className="flex justify-center">
                  <button
                    onClick={() => setR2Activated(!r2Activated)}
                    className="flex items-center gap-3 group"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${r2Activated ? 'bg-primary border-primary' : 'bg-white border-slate-200 group-hover:border-primary/50'}`}
                    >
                      {r2Activated && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">我已完成开通</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                >
                  返回
                </button>
                <button
                  onClick={() => {
                    if (r2Activated) setStep(3)
                  }}
                  className={`flex-[2] py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${r2Activated
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-indigo-600'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  disabled={!r2Activated}
                >
                  进入最后一步
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h4 className="text-2xl font-black text-slate-900 mb-2">3. 一键构建账户令牌</h4>
                <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                  点击下方按钮将在 Cloudflare 中为您预填好令牌权限。
                </p>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2.5rem] px-8 pb-8 ">
                  <button
                    onClick={() => handleOpenExternal(tokenUrl)}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 mb-6 active:scale-[0.98]"
                  >
                    一键构建令牌
                    <ExternalLink size={20} />
                  </button>

                  <div className="bg-white/80 p-6 rounded-[1.5rem] border border-indigo-100 flex gap-4 items-start shadow-sm">
                    <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] font-bold text-slate-600 leading-relaxed">
                      <span className="text-slate-900 font-black text-sm block mb-2">关键设置提醒：</span>
                      1. 请在“区域资源”中务必选择 <span className="text-primary italic">“包括 - 账户的所有区域 - Account”</span>。<br /><br />
                      2. 选择的账户 <span className="underline">必须</span> 与您填写的 <span className="font-black text-slate-900">Account ID</span> ({accountId || '未填写'}) 属于同一个账户。<br /><br />
                      3.  创建成功后请 <span className="text-slate-900 text-red-500 font-black">务必保存令牌</span>。令牌仅展示一次。

                    </div>
                  </div>
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
    </div >
  )
}

export default CloudflareTokenModal
