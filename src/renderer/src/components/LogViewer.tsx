import React, { useEffect, useRef } from 'react'
import { Terminal, Trash2, StopCircle, CornerDownLeft } from 'lucide-react'

interface LogViewerProps {
  logs: string[]
  setLogs: (logs: string[]) => void
  onStop: () => void
  onInput: (input: string) => void
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, setLogs, onStop, onInput }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleClear = () => setLogs([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputRef.current?.value) {
      onInput(inputRef.current.value + '\n')
      inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="text-primary" size={20} />
          <h2 className="text-xl font-bold">部署日志</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onStop}
            className="p-2 hover:bg-slate-800 rounded-lg text-red-500 transition-colors"
            title="停止执行"
          >
            <StopCircle size={20} />
          </button>
          <button
            onClick={handleClear}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            title="清除日志"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 bg-slate-900/50 rounded-xl p-4 font-mono text-sm overflow-y-auto border border-slate-800"
      >
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">等待日志输出...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap mb-1 text-slate-300">
              <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
              {log}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="输入控制台交互内容 (如 login 确认)..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-primary/50 font-mono text-sm pr-12"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 rounded text-slate-400 hover:text-primary transition-colors hover:bg-slate-700"
        >
          <CornerDownLeft size={16} />
        </button>
      </form>
    </div>
  )
}

export default LogViewer
