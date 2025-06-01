// src/pages/ProjectDetails.jsx
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import LinkManager from './LinkManager'
import AnalyticsPage from './AnalyticsPage'
import FileDashboard from '../pages/files/FileDashboard'

const ProjectDetails = () => {
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState('links')
  const [project, setProject] = useState(null)
  const [shortLinks, setShortLinks] = useState([])
  const [loading, setLoading] = useState(true)

  // ← state for "which shortCode to show analytics for" 
  const [selectedShortCode, setSelectedShortCode] = useState(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/project/get-project/${projectId}`,
          { withCredentials: true }
        )
        setProject(response.data.project)
        setShortLinks(response.data.shortLinks)
      } catch (error) {
        console.error('Failed to fetch project:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (loading) {
    return <div className="p-8 text-gray-700">Loading project...</div>
  }
  if (!project) {
    return <div className="p-8 text-red-600">Project not found.</div>
  }

  // ─────────── Wrap setActiveTab so that whenever the user clicks "Analytics"
  // from the sidebar, we clear out any previously‐selected shortCode. ───────────
  const handleTabSwitch = (tab) => {
    if (tab === 'analytics') {
      // Clear any leftover shortCode so AnalyticsPage does project-wide view
      setSelectedShortCode(null)
    }
    setActiveTab(tab)
  }

  return (
    <div className="flex h-full min-h-screen bg-black text-white">
      {/** Pass handleTabSwitch instead of raw setActiveTab **/}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        project={project}
      />

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'links' && (
          <LinkManager
            project={project}
            shortLinks={shortLinks}
            setShortLinks={setShortLinks}
            // ← When a specific link's "View Analytics" is clicked…
            onViewAnalytics={(code) => {
              // …we set that shortCode, THEN switch to analytics.
              setSelectedShortCode(code)
              setActiveTab('analytics')
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            project={project}
            // If selectedShortCode is null => shows project‐wide analytics
            shortCode={selectedShortCode}
          />
        )}

        {activeTab === 'files' && (
          <FileDashboard 
            project={project}
            projectId={projectId}
          />
        )}
      </main>
    </div>
  )
}

export default ProjectDetails
