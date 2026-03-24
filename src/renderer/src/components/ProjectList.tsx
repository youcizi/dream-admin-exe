import { useState, useEffect } from 'react';
import { Play, FolderOpen } from 'lucide-react';

interface Project {
  path: string;
  name: string;
  config: string;
}

const ProjectList: React.FC<{ onDeploy: (project: Project) => void }> = ({ onDeploy }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [rootPath, setRootPath] = useState('');

  const scanProjects = async (path: string) => {
    setLoading(true);
    try {
      const results = await window.api.wrangler.scanProjects(path);
      setProjects(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    // In a real electron app, use dialog.showOpenDialog
    // For now, let's assume the user enters a path or we use a default
    const path = 'e:/my_objects'; // Hardcoded for demo or logic
    setRootPath(path);
    scanProjects(path);
  };

  useEffect(() => {
    // Initial scan if rootPath is set
    if (rootPath) scanProjects(rootPath);
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">项目列表</h2>
          <p className="text-slate-400 mt-1">自动识别目录下的 wrangler.toml 项目</p>
        </div>
        <button 
          onClick={handleSelectFolder}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <FolderOpen size={18} />
          选择目录
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700">
          <p className="text-slate-500">未发现项目，请选择包含 wrangler.toml 的目录</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl hover:border-primary/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <Play size={20} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onDeploy(project)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-transform active:scale-95 flex items-center gap-2"
                  >
                    部署
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1 truncate">{project.name}</h3>
              <p className="text-slate-500 text-xs font-mono truncate mb-4">{project.path}</p>
              
              <div className="p-3 bg-slate-900/50 rounded-lg text-xs font-mono text-slate-400 whitespace-pre overflow-hidden h-20 relative">
                {project.config.split('\n').slice(0, 5).join('\n')}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
