import React, { useState } from 'react';
import { X, Globe, ArrowRight, Loader2 } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoad = async () => {
    if (!url) return;
    setLoading(true);
    
    // Simulate loading/login process
    // In a real scenario, this might involve an IPC call to valid URL or setup a session
    setTimeout(() => {
      setLoading(false);
      onSuccess(url);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">添加新项目</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            请输入您项目的后台 URL。我们将尝试载入登录页面，以便您完成授权并同步数据。
          </p>

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <Globe size={18} />
              </div>
              <input 
                type="text"
                placeholder="https://your-project.com/admin"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-11 pr-24 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
              <button 
                onClick={handleLoad}
                disabled={loading || !url}
                className="absolute right-2 top-2 bottom-2 px-5 bg-primary hover:bg-primary-dark disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>载入 <ArrowRight size={14} /></>}
              </button>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <p className="text-[11px] text-blue-600 font-medium">提示：请确保 URL 包含协议头 (http/https)</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
