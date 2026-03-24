import React, { useState } from 'react'
import DeploySidebar from './DeploySidebar'
import DeploySettings from './DeploySettings'

const DeployApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('settings')

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <DeploySidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        
        <div className="h-full overflow-y-auto custom-scrollbar p-10 relative z-10">
          {activeTab === 'settings' && <DeploySettings />}
          {activeTab !== 'settings' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <span className="text-2xl font-bold">?</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">即将推出</h3>
                <p className="text-sm text-slate-500">该功能正在开发中，敬请期待。</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default DeployApp
