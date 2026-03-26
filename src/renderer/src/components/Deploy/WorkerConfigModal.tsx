import React, { useState, useEffect } from 'react'
import { 
  X, RefreshCw, Copy, Check, ShieldCheck, Database, Cloud, 
  AlertCircle, Save, Zap
} from 'lucide-react'

interface WorkerConfigModalProps {
  isOpen: boolean
  onClose: () => void
  worker: { id: string; name: string } | null
  config: { apiToken: string; accountId: string } | null
  resources: {
    d1: any[]
    r2: any[]
  }
}

const WorkerConfigModal: React.FC<WorkerConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  worker, 
  config, 
  resources 
}) => {
  const [captcha, setCaptcha] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bindings, setBindings] = useState<any[]>([])

  const generateRandomCaptcha = (): void => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptcha(result)
  }

  const handleCopy = (text: string, id: string): void => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopySuccess(id)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const fetchBindings = async (): Promise<void> => {
    if (!worker || !config) return
    setLoading(true)
    setError(null)
    try {
      const data = await window.api.cloudflare.getWorkerBindings(
        config.apiToken,
        config.accountId,
        worker.id || worker.name
      )
      setBindings(data || [])
      
      // Try to find CF_ADMIN_CAPTCHA in bindings
      const captchaBinding = data?.find((b: any) => b.name === 'CF_ADMIN_CAPTCHA')
      if (captchaBinding && captchaBinding.type === 'plain_text') {
        setCaptcha(captchaBinding.text || '')
      } else if (captchaBinding && captchaBinding.type === 'secret_text') {
        setCaptcha('********') // Secret is write-only, value is masked
      }
    } catch (err: any) {
      console.error('Failed to fetch bindings:', err)
      setError('获取配置信息失败: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!worker || !config || !captcha) return
    setSaving(true)
    setError(null)
    try {
      await window.api.cloudflare.updateWorkerVar(
        config.apiToken,
        config.accountId,
        worker.id || worker.name,
        'CF_ADMIN_CAPTCHA',
        captcha
      )
      alert('保存成功！新的验证码已作为 Secret 写入 Cloudflare。')
      fetchBindings()
    } catch (err: any) {
      console.error('Failed to save captcha:', err)
      setError('保存失败: ' + (err.message || String(err)))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (isOpen && worker) {
      fetchBindings()
    }
  }, [isOpen, worker])

  if (!isOpen) return null

  // Find bindings
  const d1Binding = bindings.find(b => b.type === 'd1')
  const r2Binding = bindings.find(b => b.type === 'r2_bucket')

  // Map to friendly names
  const d1Name = d1Binding 
    ? (resources.d1.find((db: any) => db.uuid === d1Binding.database_id)?.name || d1Binding.database_name)
    : '未绑定'
  
  const r2Name = r2Binding 
    ? (resources.r2.find((b: any) => b.name === r2Binding.bucket_name)?.name || r2Binding.bucket_name)
    : '未绑定'

  // Detect if it's a Dream Admin project
  const isDreamAdmin = bindings.some(b => b.name === 'CF_ADMIN_CAPTCHA')

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {worker?.id || worker?.name} 管理
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Backend Service Configuration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <RefreshCw size={24} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">正在加载配置...</span>
            </div>
          ) : isDreamAdmin ? (
            <>
              {/* Admin Info Box */}
              <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-indigo-900 mb-1">初始管理员设置</h3>
                  <p className="text-[11px] font-bold text-indigo-700/70 leading-relaxed">
                    默认用户名: <span className="text-indigo-900 font-black">admin</span><br />
                    默认密码: <span className="text-indigo-900 font-black">admin123</span>
                  </p>
                </div>
              </div>

              {/* Captcha Configuration */}
              <div className="space-y-4 animate-in fade-in slide-in-from-top-6 duration-700">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">后台验证码 (CF_ADMIN_CAPTCHA)</span>
                    <div className="group relative">
                      <AlertCircle size={12} className="text-slate-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center font-bold">
                        用于保护后台登录入口。保存后将作为 Secret 写入 Cloudflare。
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      placeholder={loading ? "正在加载..." : "输入新验证码..."}
                      disabled={loading}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold font-mono focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all pr-12"
                    />
                    <button
                      onClick={() => handleCopy(captcha, 'captcha')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                    >
                      {copySuccess === 'captcha' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={generateRandomCaptcha}
                    title="生成随机预览"
                    className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg transition-all active:scale-95 shadow-sm"
                  >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !captcha || captcha === '********'}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  保存配置到云端
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 px-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">非 Dream Admin 后台</h3>
                <p className="text-[11px] font-bold text-slate-300 leading-relaxed max-w-[240px]">
                  未检测到验证码变量，已隐藏系统设置。当前仅支持基础资源查看。
                </p>
              </div>
            </div>
          )}

          {/* Associated Resources */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">关联基础设施</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* D1 */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-400 shadow-sm">
                  <Database size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">D1 Database</p>
                  <p className="text-[12px] font-bold text-slate-700 truncate" title={d1Name}>
                    {d1Name}
                  </p>
                </div>
                {d1Binding && (
                  <button 
                    onClick={() => handleCopy(d1Name, 'd1')}
                    className="text-slate-300 hover:text-primary p-1 transition-colors"
                  >
                    {copySuccess === 'd1' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              {/* R2 */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-400 shadow-sm">
                  <Cloud size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">R2 Bucket</p>
                  <p className="text-[12px] font-bold text-slate-700 truncate" title={r2Name}>
                    {r2Name}
                  </p>
                </div>
                {r2Binding && (
                  <button 
                    onClick={() => handleCopy(r2Name, 'r2')}
                    className="text-slate-300 hover:text-primary p-1 transition-colors"
                  >
                    {copySuccess === 'r2' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {error && (
          <div className="p-4 bg-rose-50 border-t border-rose-100 flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-tight">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkerConfigModal
