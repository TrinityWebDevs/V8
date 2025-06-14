// src/components/Notes.jsx
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import NoteEditor from './NoteEditor'
import toast from 'react-hot-toast'
import debounce from 'lodash.debounce'
import { FileText as FileTextIcon, Search as SearchIcon } from 'lucide-react'

const BACKEND = 'http://localhost:3000' // adjust if needed

export default function Notes({ project }) {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [localContent, setLocalContent] = useState(null)
  const [localTitle, setLocalTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch notes for this project, with robust selectedNote refresh
  const fetchNotes = async () => {
    if (!project?._id) return
    setLoadingNotes(true)
    try {
      const res = await axios.get(
        `${BACKEND}/api/notes/project/${project._id}`,
        { withCredentials: true }
      )
      const data = res.data || []
      console.log('Fetched notes:', data)
      setNotes(data)

      if (selectedNote) {
        // If a note was previously selected, refresh it if still present
        const fresh = data.find(n => n._id === selectedNote._id)
        if (fresh) {
          setSelectedNote(fresh)
          setLocalContent(fresh.content)
          setLocalTitle(fresh.title || '')
        } else if (data.length > 0) {
          // previously selected deleted, pick first
          setSelectedNote(data[0])
        } else {
          setSelectedNote(null)
        }
      } else {
        // No previously selected, pick first if exists
        if (data.length > 0) {
          setSelectedNote(data[0])
        } else {
          setSelectedNote(null)
        }
      }
    } catch (err) {
      console.error('fetchNotes error', err)
      toast.error('Failed to fetch notes')
    } finally {
      setLoadingNotes(false)
    }
  }

  // On mount or when project changes, fetch notes
  useEffect(() => {
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id])

  // When selectedNote changes, initialize local buffers and cancel pending saves
  useEffect(() => {
    // Cancel any pending save for previous note
    debouncedSave.cancel()

    if (selectedNote) {
      setLocalContent(selectedNote.content)
      setLocalTitle(selectedNote.title || '')
    } else {
      setLocalContent(null)
      setLocalTitle('')
    }
  }, [selectedNote])

  // Debounced save: title + content
  const debouncedSave = useRef(
    debounce(async (noteId, title, content) => {
      console.log('debouncedSave for noteId=', noteId)
      try {
        setSaving(true)
        const res = await axios.put(
          `${BACKEND}/api/notes/${noteId}`,
          { title, content },
          { withCredentials: true }
        )
        console.log('Save response', res.data)
        const updatedNote = res.data
        // Update notes array and selectedNote
        setNotes(prev =>
          prev.map(n => (n._id === noteId ? updatedNote : n))
        )
        setSelectedNote(updatedNote)
      } catch (err) {
        console.error('Save error', err)
        toast.error('Failed to save note')
      } finally {
        setSaving(false)
      }
    }, 1500)
  ).current

  // Handler for content updates from NoteEditor
  const handleContentChange = (json) => {
    setLocalContent(json)
    if (selectedNote) {
      debouncedSave(selectedNote._id, localTitle, json)
    }
  }

  // Handler for title changes
  const handleTitleChange = (e) => {
    const title = e.target.value
    setLocalTitle(title)
    if (selectedNote) {
      // Optimistically update sidebar list
      setNotes(prev =>
        prev.map(n =>
          n._id === selectedNote._id ? { ...n, title } : n
        )
      )
      // Update selectedNote state
      setSelectedNote(prev => prev ? { ...prev, title } : prev)
      // Schedule save
      debouncedSave(selectedNote._id, title, localContent)
    }
  }

  // Create new note
  const handleCreateNote = async () => {
    try {
      const res = await axios.post(
        `${BACKEND}/api/notes/create`,
        {
          projectId: project._id,
          title: 'Untitled Note',
          content: { type: 'doc', content: [{ type: 'paragraph' }] },
        },
        { withCredentials: true }
      )
      console.log('Created note', res.data)
      toast.success('Note created')
      const newNote = res.data
      // Prepend to notes list
      setNotes(prev => [newNote, ...prev])
      setSelectedNote(newNote)
    } catch (err) {
      console.error('Create note error', err)
      toast.error('Failed to create note')
    }
  }

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await axios.delete(`${BACKEND}/api/notes/${noteId}`, {
        withCredentials: true,
      })
      console.log('Deleted note', noteId)
      toast.success('Note deleted')
      setNotes(prev => prev.filter(n => n._id !== noteId))
      if (selectedNote?._id === noteId) {
        setSelectedNote(null)
      }
    } catch (err) {
      console.error('Delete error', err)
      toast.error('Failed to delete')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush()
    }
  }, [])

  // Filtered notes by searchTerm
  const filteredNotes = notes.filter(n =>
    (n.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold">Notes</h2>
          <button
            onClick={handleCreateNote}
            className="text-indigo-600 hover:text-indigo-800"
          >
            + New
          </button>
        </div>
        {/* Search */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="relative text-gray-500 dark:text-gray-400">
            <SearchIcon className="absolute left-2 top-2 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none"
            />
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-auto">
          {loadingNotes ? (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notes</div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?._id === note._id
              return (
                <div
                  key={note._id}
                  onClick={() => setSelectedNote(note)}
                  className={`px-4 py-2 cursor-pointer flex justify-between items-center ${
                    isSelected
                      ? 'bg-indigo-100 dark:bg-indigo-700'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="truncate">{note.title || 'Untitled'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note._id)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Editor Pane */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Title Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <input
                type="text"
                value={localTitle}
                onChange={handleTitleChange}
                placeholder="Note title..."
                className="w-full text-xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-gray-100"
              />
            </div>
            {/* Editor */}
            <NoteEditor
              content={localContent}
              onUpdate={handleContentChange}
            />
            {/* Save status */}
            <div className="p-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {saving ? 'Saving...' : 'All changes saved'}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <FileTextIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              No note selected
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
