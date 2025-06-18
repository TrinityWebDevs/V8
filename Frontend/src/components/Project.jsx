import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showNewProjectPopup, setShowNewProjectPopup] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/project/my-projects`, { withCredentials: true });
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    }
  };

  const openProjectPopup = async (project, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    setSelectedProject(project);
    setShowPopup(true);
    const results = await Promise.all(
      project.members.map((id) =>
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/project/get-member-details`, { userId: id }, { withCredentials: true })
      )
    );
    setMembers(results.map((res) => res.data.user));
  };

  const closePopup = () => {
    setShowPopup(false);
    setSearchInput('');
    setSearchResults([]);
    setMembers([]);
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim() === '') return setSearchResults([]);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/project/search-users`,
        { namePrefix: value },
        { withCredentials: true }
      );
      setSearchResults(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/project/add-members`,
        { projectName: selectedProject.name, userIds: [userId] },
        { withCredentials: true }
      );
      openProjectPopup(selectedProject, { stopPropagation: () => {} }); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  const goToProjectDetail = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const openNewProjectPopup = () => {
    setShowNewProjectPopup(true);
  };

  const closeNewProjectPopup = () => {
    setShowNewProjectPopup(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/project/new-project`,
        { 
          name: newProjectName.trim(),
          description: newProjectDescription.trim() 
        },
        { withCredentials: true }
      );
      fetchProjects(); // Refresh the projects list
      closeNewProjectPopup();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Projects</h2>
        <button 
          onClick={openNewProjectPopup}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Project
        </button>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 text-lg mb-4">You don't have any projects yet.</p>
          <button 
            onClick={openNewProjectPopup}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg pb-3 transition-shadow duration-300 overflow-hidden cursor-pointer relative group"
              onClick={() => goToProjectDetail(project._id)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800 truncate mr-8">{project.name}</h3>
                  <button
                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                    onClick={(e) => openProjectPopup(project, e)}
                    title="View Members"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {project.description || "No description provided"}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2 overflow-hidden">
                    {project.members.slice(0, 3).map((member, index) => (
                      <div key={index} className="w-8 h-8 hidden rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                        {/* Placeholder for member photos */}
                        <span className="text-xs text-gray-600"></span>
                      </div>
                    ))}
                    {project.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{project.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-50 to-transparent p-4 flex justify-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center text-blue-600">
                  <span className="mr-1">View Project</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50" onClick={closePopup}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Team Members</h3>
              <button 
                onClick={closePopup} 
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-500 uppercase text-sm tracking-wider mb-3">Project</h4>
              <p className="text-xl font-semibold text-gray-800">{selectedProject.name}</p>
            </div>

            {/* Current members */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-500 uppercase text-sm tracking-wider mb-3">Current Members</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800">{member.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <h4 className="font-medium text-gray-500 uppercase text-sm tracking-wider mb-3">Add New Members</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchInput}
                  onChange={handleSearchChange}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="mt-3 max-h-40 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-2 my-1 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        {user.photo ? (
                          <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs">{user.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <button
                        className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm transition-colors"
                        onClick={() => handleAddMember(user._id)}
                      >
                        Add
                      </button>
                    </div>
                  ))
                ) : searchInput ? (
                  <p className="text-center text-gray-500 py-2">No users found</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Popup */}
      {showNewProjectPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50" onClick={closeNewProjectPopup}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Create New Project</h3>
              <button 
                onClick={closeNewProjectPopup} 
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeNewProjectPopup}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;