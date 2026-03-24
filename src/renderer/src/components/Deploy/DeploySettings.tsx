import React, { useState, useEffect } from 'react'
import { Save, Cloud, Key, User, CheckCircle2 } from 'lucide-react'

const DeploySettings: React.FC = () => {
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedConfig = localStorage.getItem('cloudflare_config')
    if (savedConfig) {
      const { apiToken: t, accountId: a } = JSON.parse(savedConfig)
      setApiToken(t || '')
      setAccountId(a || '')
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('cloudflare_config', JSON.stringify({ apiToken, accountId }))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">基础设施配置</h1>
        <p className="text-slate-500 font-medium">
          配置您的 Cloudflare 凭据，以便系统能够代表您管理和部署应用。
        </p>
      </div>

      <div className="grid gap-8">
        {/* API Token Section */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Key size={120} />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary">
              <Key size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Cloudflare API Token</h3>
              <p className="text-sm text-slate-400">
                用于授权 API 请求的令牌 (Wrangler 配置中使用)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              placeholder="请输入您的 API Token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
            />
            <p className="text-[11px] text-slate-400 px-2 italic">
              提示：请确保令牌具有访问 Pages, Workers 和 D1 的权限。
            </p>
          </div>
        </div>

        {/* Account ID Section */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <User size={120} />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Account ID</h3>
              <p className="text-sm text-slate-400">您的 Cloudflare 账户唯一标识符</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="请输入您的 Account ID"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              多账号支持即将推出
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={!apiToken || !accountId}
            className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              saved
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-white shadow-2xl shadow-indigo-900/20 hover:-translate-y-1 hover:bg-slate-800 active:scale-95 disabled:bg-slate-200 disabled:shadow-none'
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
                <span>应用配置</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-16 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-6 items-start">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-500 shrink-0">
          <Cloud size={24} />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          登录您的{' '}
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary font-bold hover:underline"
          >
            Cloudflare 控制台
          </a>
          。 Account ID 可以在仪表盘右侧栏找到；API Token 可以在“我的个人资料 {'->'} API
          令牌”中创建。 建议使用“编辑 Cloudflare Workers”模板生成的令牌。
        </p>
      </div>
    </div>
  )
}

export default DeploySettings
