import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

import Sidebar from '../components/Sidebar'
import LinkManager from './LinkManager'
import AnalyticsPage from './AnalyticsPage'

const ProjectDetails = () => {
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState('links')
  const [project, setProject] = useState(null)
  const [shortLinks, setShortLinks] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="p-8 text-gray-700">Loading project...</div>
  if (!project) return <div className="p-8 text-red-600">Project not found.</div>

  return (
    <div className="flex h-full min-h-screen bg-black text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} project={project} />
      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'links' && (
          <LinkManager project={project} shortLinks={shortLinks} setShortLinks={setShortLinks} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsPage project={project} shortLinks={shortLinks} />
        )}
      </main>
    </div>
  )
}

export default ProjectDetails
