import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Cloud, File, Folder, Search, RefreshCw, X, 
  ChevronRight, AlertCircle, Upload, Trash2, 
  ArrowLeft, FileText, ImageIcon, Music, Video, Archive,
  MoreVertical
} from 'lucide-react'
import { motion } from 'framer-motion'

interface R2ViewerProps {
  isOpen: boolean
  onClose: () => void
  bucketName: string
  config: { apiToken: string; accountId: string } | null
}

interface R2Object {
  key: string
  size: number
  uploaded: string
  etag: string
  httpMetadata?: Record<string, string>
  customMetadata?: Record<string, string>
}

export const R2Viewer: React.FC<R2ViewerProps> = ({ isOpen, onClose, bucketName, config }) => {
  const [objects, setObjects] = useState<R2Object[]>([])
  const [prefixes, setPrefixes] = useState<string[]>([])
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchObjects = useCallback(async (prefix: string) => {
    if (!config || !bucketName) return
    const { apiToken, accountId } = config
    setLoading(true)
    setError(null)
    try {
      // @ts-expect-error - window.api.cloudflare is added in preload
      const res = await window.api.cloudflare.listR2Objects(apiToken, accountId, bucketName, prefix)
      if (res.success) {
        setObjects(res.result.objects || [])
        setPrefixes(res.result.delimitedPrefixes || [])
      } else {
        throw new Error(res.errors?.[0]?.message || '获取文件列表失败')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [config, bucketName])

  useEffect(() => {
    if (isOpen) {
      fetchObjects(currentPrefix)
    }
  }, [isOpen, currentPrefix, fetchObjects])

  const handleFolderClick = (prefix: string) => {
    setCurrentPrefix(prefix)
  }

  const handleBackClick = () => {
    const parts = currentPrefix.split('/').filter(Boolean)
    parts.pop()
    setCurrentPrefix(parts.length > 0 ? parts.join('/') + '/' : '')
  }

  const handleDelete = async (key: string) => {
    if (!window.confirm(`确定要删除 ${key} 吗？`)) return
    if (!config) return
    const { apiToken, accountId } = config
    try {
      // @ts-expect-error - window.api.cloudflare is added in preload
      const res = await window.api.cloudflare.deleteR2Object(apiToken, accountId, bucketName, key)
      if (res.success) {
        fetchObjects(currentPrefix)
      } else {
        throw new Error(res.errors?.[0]?.message || '删除失败')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!config) return
    const { apiToken, accountId } = config
    setUploading(true)
    try {
      const key = currentPrefix + file.name
      // @ts-expect-error - window.api.cloudflare is added in preload
      const res = await window.api.cloudflare.uploadR2Object(apiToken, accountId, bucketName, key, file.path)
      if (res.success) {
        fetchObjects(currentPrefix)
      } else {
        throw new Error(res.errors?.[0]?.message || '上传失败')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (key: string) => {
    const ext = key.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-blue-400" />
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music className="w-5 h-5 text-purple-400" />
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return <Video className="w-5 h-5 text-red-400" />
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return <Archive className="w-5 h-5 text-yellow-400" />
    if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css'].includes(ext || '')) return <FileText className="w-5 h-5 text-gray-400" />
    return <File className="w-5 h-5 text-gray-400" />
  }

  const filteredObjects = objects.filter(obj => 
    obj.key.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredPrefixes = prefixes.filter(p => 
    p.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1a1a] border border-white/10 w-full max-w-6xl h-[85vh] rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl shadow-black/50"
      >
        {/* Header */}
        <div className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/5">
              <Cloud className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white/90 flex items-center gap-2">
                {bucketName}
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/40 uppercase tracking-wider border border-white/5">R2 Bucket</span>
              </h2>
              <div className="flex items-center gap-1 text-sm text-white/40 mt-0.5">
                <button 
                  onClick={() => setCurrentPrefix('')}
                  className="hover:text-white/60 transition-colors"
                >
                  root
                </button>
                {currentPrefix.split('/').filter(Boolean).map((part, i, arr) => (
                  <React.Fragment key={part}>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                    <button 
                      onClick={() => {
                        const newPrefix = arr.slice(0, i + 1).join('/') + '/'
                        setCurrentPrefix(newPrefix)
                      }}
                      className="hover:text-white/60 transition-colors"
                    >
                      {part}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-500/50 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文件或目录..."
                className="w-64 h-11 pl-11 pr-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-orange-500/30 focus:bg-white/[0.05] transition-all"
              />
            </div>
            
            <button 
              onClick={() => fetchObjects(currentPrefix)}
              disabled={loading}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-white/50 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-11 px-6 flex items-center justify-center gap-2 rounded-2xl bg-orange-600 border border-orange-500/50 text-white font-medium hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {uploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? '上传中...' : '上传文件'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              className="hidden" 
            />

            <div className="w-px h-6 bg-white/5 mx-2" />

            <button 
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-white/50 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {error && (
            <div className="m-10 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500/90 text-sm animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-thin scrollbar-white/5 h-full">
            {loading && objects.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                <RefreshCw className="w-10 h-10 animate-spin text-orange-500" />
                <p className="text-white/40 text-sm font-medium tracking-wide">正在同步存储桶数据...</p>
              </div>
            ) : filteredObjects.length === 0 && filteredPrefixes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-2">
                  <Search className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/30 text-base font-medium">在这个目录下什么也没找到</p>
                {currentPrefix && (
                  <button 
                    onClick={handleBackClick}
                    className="text-orange-500/70 hover:text-orange-500 text-sm font-medium transition-colors"
                  >
                    返回上级目录
                  </button>
                )}
              </div>
            ) : (
              <div className="py-6">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[11px] font-bold text-white/20 uppercase tracking-[0.15em] px-4">
                      <th className="pb-4 pl-4 font-semibold w-12">类型</th>
                      <th className="pb-4 font-semibold">名称</th>
                      <th className="pb-4 font-semibold w-32">大小</th>
                      <th className="pb-4 font-semibold w-48">最后修改</th>
                      <th className="pb-4 text-center w-32 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Back Item */}
                    {currentPrefix && (
                      <tr 
                        onClick={handleBackClick}
                        className="group bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all cursor-pointer"
                      >
                        <td className="py-4 pl-4 rounded-l-2xl">
                          <ArrowLeft className="w-5 h-5 text-white/20 group-hover:text-orange-500/50 transition-colors" />
                        </td>
                        <td className="py-4 text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">
                          ...
                        </td>
                        <td colSpan={3} className="py-4 pr-4 rounded-r-2xl" />
                      </tr>
                    )}

                    {/* Folders */}
                    {filteredPrefixes.map((prefix) => (
                      <tr 
                        key={prefix}
                        onClick={() => handleFolderClick(prefix)}
                        className="group bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all cursor-pointer"
                      >
                        <td className="py-4 pl-4 rounded-l-2xl">
                          <Folder className="w-5 h-5 text-orange-500/60 group-hover:text-orange-500 transition-colors" />
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-white/70 group-hover:text-white transition-colors">
                              {prefix.slice(currentPrefix.length, -1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-white/30 font-mono">—</td>
                        <td className="py-4 text-sm text-white/30 font-mono">—</td>
                        <td className="py-4 pr-4 rounded-r-2xl text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Files */}
                    {filteredObjects.map((obj) => (
                      <tr 
                        key={obj.key}
                        className="group bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all"
                      >
                        <td className="py-4 pl-4 rounded-l-2xl">
                          {getFileIcon(obj.key)}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-white/70 group-hover:text-white transition-colors truncate max-w-sm">
                              {obj.key.slice(currentPrefix.length)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-white/40 font-mono">
                          {formatSize(obj.size)}
                        </td>
                        <td className="py-4 text-sm text-white/40 font-mono">
                          {new Date(obj.uploaded).toLocaleString()}
                        </td>
                        <td className="py-4 pr-4 rounded-r-2xl">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              title="删除"
                              onClick={() => handleDelete(obj.key)}
                              className="p-2 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              title="详情"
                              className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="h-10 px-10 flex items-center justify-between border-t border-white/5 bg-white/[0.01] text-[10px] text-white/20 font-medium tracking-wider uppercase">
            <div className="flex items-center gap-4">
              <span>共 {objects.length} 个对象</span>
              <span>{prefixes.length} 个目录</span>
            </div>
            <div className="flex items-center gap-4 italic lowercase">
              <span>Cloudflare R2 Storage</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
