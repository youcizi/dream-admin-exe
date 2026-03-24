import React, { useState, useEffect } from 'react'
import { X, Key, User, ExternalLink, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface DeployConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: { apiToken: string; accountId: string }) => void
  initialConfig?: { apiToken: string; accountId: string }
}

const DeployConfigModal: React.FC<DeployConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig
}) => {
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialConfig) {
      setApiToken(initialConfig.apiToken || '')
      setAccountId(initialConfig.accountId || '')
    }
  }, [initialConfig, isOpen])

  if (!isOpen) return null

  const handleSave = (): void => {
    if (!apiToken || !accountId) {
      setError('请提供完整的 API Token 和 Account ID')
      return
    }
    setError('')
    onSave({ apiToken, accountId })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-primary to-emerald-500" />

        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Cloudflare 账户配置
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1">配置您的凭据以开始部署</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* API Token */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                <Key size={14} className="text-indigo-500" />
                Cloudflare API Token
              </label>
              <input
                type="password"
                placeholder="在此输入您的 API Token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>

            {/* Account ID */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                <User size={14} className="text-emerald-500" />
                Account ID
              </label>
              <input
                type="text"
                placeholder="在此输入您的 Account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="pt-4 flex flex-col gap-4">
              <button
                onClick={handleSave}
                disabled={saved}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  saved
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:-translate-y-1 active:scale-95'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>配置已保存</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>保存配置</span>
                  </>
                )}
              </button>

              <a
                href="https://blog.ycz.me"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-primary hover:text-indigo-700 text-xs font-bold transition-colors group"
              >
                不知道如何获取？查看配置教程
                <ExternalLink
                  size={12}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeployConfigModal
