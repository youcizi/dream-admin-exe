import React, { useState, useEffect, useCallback } from 'react'
import { 
  Database, Table, Layout, Search, RefreshCw, X, 
  ChevronRight, AlertCircle, Hash, Key, 
  Columns, Rows, Download, FileJson, FileCode
} from 'lucide-react'

interface D1ViewerProps {
  isOpen: boolean
  onClose: () => void
  database: { uuid: string; name: string } | null
  config: { apiToken: string; accountId: string } | null
}

interface TableInfo {
  name: string
  schema: string
  type: string
}

interface ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: any
  pk: number
}

const D1Viewer: React.FC<D1ViewerProps> = ({ isOpen, onClose, database, config }) => {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'schema' | 'data'>('schema')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const apiToken = config?.apiToken || ''
  const accountId = config?.accountId || ''
  const databaseUuid = database?.uuid || ''

  const fetchTables = useCallback(async () => {
    if (!apiToken || !accountId || !databaseUuid) {
      setError('API Token, Account ID, or Database UUID is missing.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // @ts-expect-error - window.api.cloudflare is added in preload
      const response = await window.api.cloudflare.queryD1(
        apiToken, 
        accountId, 
        databaseUuid, 
        'PRAGMA table_list'
      )
      
      if (response.success && response.result?.[0]?.results) {
        const allTables = response.result[0].results as any[]
        const userTables = allTables
          .filter((t) => !t.name.startsWith('sqlite_') && !t.name.startsWith('_cf_'))
          .map((t) => ({
            name: t.name,
            schema: t.schema,
            type: t.type
          }))
        setTables(userTables)
      } else {
        throw new Error(response.errors?.[0]?.message || '获取表列表失败')
      }
    } catch (err: any) {
      setError(err.message || '查询出错')
    } finally {
      setLoading(false)
    }
  }, [apiToken, accountId, databaseUuid])

  const fetchTableData = useCallback(async (tableName: string) => {
    if (!apiToken || !accountId || !databaseUuid) return
    setLoading(true)
    try {
      // @ts-expect-error - window.api.cloudflare is added in preload
      const response = await window.api.cloudflare.queryD1(
        apiToken, accountId, databaseUuid, `SELECT * FROM "${tableName}" LIMIT 100`
      )
      if (response.success && response.result?.[0]?.results) {
        setTableData(response.result[0].results as any[])
      } else {
        throw new Error(response.errors?.[0]?.message || '获取数据失败')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiToken, accountId, databaseUuid])

  const fetchTableInfo = useCallback(async (tableName: string) => {
    if (!apiToken || !accountId || !databaseUuid) return
    setLoading(true)
    try {
      // @ts-expect-error - window.api.cloudflare is added in preload
      const response = await window.api.cloudflare.queryD1(
        apiToken, accountId, databaseUuid, `PRAGMA table_info("${tableName}")`
      )
      if (response.success && response.result?.[0]?.results) {
        setColumns(response.result[0].results as ColumnInfo[])
        setSelectedTable(tableName)
        if (viewMode === 'data') {
          fetchTableData(tableName)
        }
      } else {
        throw new Error(response.errors?.[0]?.message || '获取表结构失败')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiToken, accountId, databaseUuid, viewMode, fetchTableData])

  const handleExport = async () => {
    if (!apiToken || !accountId || !databaseUuid || tables.length === 0) return
    setExporting(true)
    setError(null)
    try {
      let fullSql = `-- D1 Database Export: ${database?.name || 'Unknown'}\n-- Generated at: ${new Date().toLocaleString()}\n\n`
      
      for (const table of tables) {
        // 1. Get CREATE TABLE statement
        // @ts-expect-error - window.api.cloudflare is added in preload
        const schemaRes = await window.api.cloudflare.queryD1(
          apiToken, accountId, databaseUuid, `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.name}'`
        )
        const createSql = schemaRes.result?.[0]?.results?.[0]?.sql || ''
        fullSql += `DROP TABLE IF EXISTS "${table.name}";\n${createSql};\n\n`

        // 2. Get all data
        // @ts-expect-error - window.api.cloudflare is added in preload
        const dataRes = await window.api.cloudflare.queryD1(
          apiToken, accountId, databaseUuid, `SELECT * FROM "${table.name}"`
        )
        const rows = (dataRes.result?.[0]?.results as any[]) || []
        
        if (rows.length > 0) {
          const keys = Object.keys(rows[0])
          const chunks: string[] = []
          for (let i = 0; i < rows.length; i += 50) {
            const chunk = rows.slice(i, i + 50)
            const values = chunk.map(row => 
              '(' + keys.map(k => {
                const val = row[k]
                if (val === null) return 'NULL'
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
                return val
              }).join(', ') + ')'
            ).join(',\n')
            chunks.push(`INSERT INTO "${table.name}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES\n${values};`)
          }
          fullSql += chunks.join('\n\n') + '\n\n'
        }
      }

      const defaultFilename = `${database?.name || 'd1-export'}_${new Date().toISOString().split('T')[0]}.sql`
      
      // @ts-expect-error - window.api.project.saveFile is added in preload
      const savedPath = await window.api.project.saveFile(fullSql, defaultFilename)
      
      if (savedPath) {
        alert(`数据库导出成功！\n保存路径: ${savedPath}`)
      }
    } catch (err: any) {
      setError(`导出失败: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (isOpen && database && config) {
      fetchTables()
    } else {
      setTables([])
      setSelectedTable(null)
      setColumns([])
      setTableData([])
      setViewMode('schema')
      setError(null)
      setSearchTerm('')
    }
  }, [isOpen, database, config, fetchTables])

  useEffect(() => {
    if (selectedTable && viewMode === 'data') {
      fetchTableData(selectedTable)
    }
  }, [selectedTable, viewMode, fetchTableData])

  const filteredTables = tables.filter((t) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Database size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                {database?.name || 'N/A'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded uppercase tracking-widest font-mono">
                  {databaseUuid || 'N/A'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || tables.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
            >
              {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              一键导出全库
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all hover:rotate-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-50 flex flex-col shrink-0 bg-slate-50/20">
            <div className="p-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="搜索数据表..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 focus:border-indigo-200 rounded-2xl text-xs font-bold outline-none shadow-sm transition-all focus:ring-4 focus:ring-indigo-50/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
              <div className="px-3 mb-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  数据表 ({filteredTables.length})
                </span>
                <button onClick={fetchTables} className="text-indigo-500 hover:text-indigo-600">
                  <RefreshCw size={12} className={loading && tables.length === 0 ? 'animate-spin' : ''} />
                </button>
              </div>
              
              {loading && tables.length === 0 ? (
                <div className="py-20 text-center">
                  <RefreshCw className="animate-spin text-slate-200 mx-auto mb-3" size={32} />
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">正在检索...</p>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <Layout className="text-slate-100 mx-auto mb-4" size={48} />
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">未找到数据表</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredTables.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => fetchTableInfo(table.name)}
                      className={`w-full text-left px-4 py-4 rounded-2xl flex items-center justify-between group transition-all duration-300 ${
                        selectedTable === table.name 
                          ? 'bg-white text-indigo-600 shadow-md border border-slate-100 scale-[1.02]' 
                          : 'hover:bg-white/50 text-slate-500 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <Table size={18} className={selectedTable === table.name ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400'} />
                        <span className="text-[13px] font-black truncate tracking-tight">{table.name}</span>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 transition-all ${selectedTable === table.name ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
            {selectedTable ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Table Header & Toggle */}
                <div className="px-10 py-6 bg-white border-b border-slate-100 shrink-0 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                        {viewMode === 'schema' ? <Columns size={20} /> : <Rows size={20} />}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {selectedTable}
                      </h3>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      {viewMode === 'schema' ? `字段定义 · ${columns.length}` : `数据记录 · 仅展示前 100 条`}
                    </p>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setViewMode('schema')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        viewMode === 'schema' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <FileCode size={14} />
                      表结构
                    </button>
                    <button
                      onClick={() => setViewMode('data')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        viewMode === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <FileJson size={14} />
                      数据内容
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-8">
                  {error && (
                    <div className="mb-6 p-5 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-500 animate-in shake duration-500">
                      <AlertCircle size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                      <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {viewMode === 'schema' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {columns.map((col) => (
                        <div 
                          key={col.cid} 
                          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${col.pk ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200'} transition-all`}>
                                {col.pk ? <Key size={20} /> : <Hash size={20} />}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-slate-800 tracking-tight">{col.name}</h4>
                                <code className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.type}</code>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {col.pk === 1 && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-amber-100">PK</span>}
                              {col.notnull === 1 && <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-slate-100">Required</span>}
                            </div>
                          </div>
                          {col.dflt_value !== null && (
                            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">默认值:</span>
                              <code className="text-[10px] font-bold text-indigo-500">{String(col.dflt_value)}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Data Table View */
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar">
                        {tableData.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                {Object.keys(tableData[0]).map(key => (
                                  <th key={key} className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                  {Object.values(row).map((val: any, vidx) => (
                                    <td key={vidx} className="px-6 py-4 text-xs font-bold text-slate-600 whitespace-nowrap">
                                      {val === null ? <span className="text-slate-300 italic">null</span> : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-20 text-center">
                            <Rows className="text-slate-100 mx-auto mb-4" size={48} />
                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">暂无数据记录</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 flex items-center justify-center text-indigo-100 mb-8 border border-slate-50">
                  <Table size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-300 mb-3 tracking-tight">未选择数据表</h3>
                <p className="text-xs font-black text-slate-300 max-w-xs uppercase tracking-[0.2em] leading-loose">
                  请从左侧列表中选择一个数据表来预览其字段定义及具体存储的数据内容
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default D1Viewer
