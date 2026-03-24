import React, { useState } from 'react';
import { Globe, Search, Copy, Check, AlertCircle } from 'lucide-react';

const CrawlerTab: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCrawl = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await window.api.crawler.crawl(url);
      setResult(res);
    } catch (err) {
      setResult({ success: false, error: 'Request failed locally' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.data?.content) {
      navigator.clipboard.writeText(result.data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
          <Globe className="text-primary" size={32} />
        </div>
        <h2 className="text-3xl font-bold mb-2">一键网页采集</h2>
        <p className="text-slate-400">输入 URL 快速获取网页核心内容，用于自动化处理</p>
      </div>

      <div className="relative flex gap-2 mb-8 p-1 bg-slate-800/50 rounded-2xl border border-slate-700 focus-within:border-primary/50 transition-colors">
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 bg-transparent px-6 py-4 outline-none text-slate-200"
          onKeyDown={(e) => e.key === 'Enter' && handleCrawl()}
        />
        <button 
          onClick={handleCrawl}
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white px-8 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          ) : (
            <>
              <Search size={20} />
              获取内容
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!result.success ? (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-200">
              <AlertCircle size={24} />
              <div>
                <p className="font-bold">采集失败</p>
                <p className="text-sm opacity-80">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 truncate max-w-md">{result.data.title}</h3>
                  <p className="text-sm text-slate-500 truncate mt-1">{result.data.url}</p>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="p-3 hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-primary transition-all active:scale-90"
                  title="复制内容"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Meta Description</h4>
                  <p className="text-slate-300 leading-relaxed italic border-l-2 border-primary/50 pl-4 py-1">
                    {result.data.description || '无描述信息'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Parsed Content Snippet</h4>
                  <div className="bg-slate-900/60 p-6 rounded-2xl font-mono text-sm text-slate-400 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
                    {result.data.content}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CrawlerTab;
