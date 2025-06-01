import { useNavigate, useParams, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();

  const navigationItems = [
    { name: 'Built with AI', path: `/project/${projectId}/ai` },
    { name: 'Links', path: `/project/${projectId}/links` },
    { name: 'Files', path: `/project/${projectId}/files` },
    { name: 'Monitor', path: `/project/${projectId}/monitor` }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>
      <div className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
} 