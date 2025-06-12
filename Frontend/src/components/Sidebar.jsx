import React from 'react'

const Sidebar = ({ activeTab, setActiveTab, project }) => {
  const tabs = [
    { key: 'links', label: 'Links' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'files', label: 'Files' },
    { key: 'chat', label: 'Chat' }, 
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white flex-shrink-0">
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>

        {/* Members */}
        <div className="flex -space-x-3 overflow-hidden mt-4">
          {project.members.map((member) => (
            <img
              key={member._id}
              src={member.photo || '/default-avatar.png'}
              alt={member.name}
              title={member.name}
              className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
            />
          ))}
        </div>
      </div>

      <nav className="mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              `flex items-center w-full px-6 py-3 text-left text-sm font-medium transition-colors ` +
              (activeTab === tab.key
                ? 'bg-gray-700'
                : 'hover:bg-gray-800')
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar

