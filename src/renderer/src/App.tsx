import { useState } from 'react'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import MainContent from './components/Layout/MainContent'
import EmptyHome from './components/Project/EmptyHome'
import ProjectModal from './components/Project/ProjectModal'

interface ProjectInfo {
  name: string
  url: string
  token: string
}

function App() {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(() => {
    const savedProject = localStorage.getItem('currentProject')
    return savedProject ? JSON.parse(savedProject) : null
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeModule, setActiveModule] = useState('insights')

  const handleAddProjectSuccess = (url: string, token: string): void => {
    // Determine project name from URL
    const name = new URL(url).hostname || '新项目'
    const info = { name, url, token }
    setProjectInfo(info)
    localStorage.setItem('currentProject', JSON.stringify(info))
  }

  return (
    <div className="flex flex-col h-screen bg-white text-slate-800 overflow-hidden font-sans">
      <Header />

      {!projectInfo ? (
        <EmptyHome onAddProject={() => setIsModalOpen(true)} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            projectInfo={projectInfo}
          />
          <MainContent activeModule={activeModule} />
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddProjectSuccess}
      />
    </div>
  )
}

export default App
