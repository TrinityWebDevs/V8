import express from 'express'
import Note from '../model/note.model.js'

const router = express.Router()

// Create
router.post('/create', async (req, res) => {
  try {
    const { projectId, title, content } = req.body
    const note = await Note.create({ project: projectId, title, content })
    res.status(201).json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create note' })
  }
})

// Get all notes for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const notes = await Note.find({ project: req.params.projectId }).sort({
      updatedAt: -1,
    })
    res.json(notes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch notes' })
  }
})

// Update title/content/tags
router.put('/:noteId', async (req, res) => {
  try {
    const { title, content, tags } = req.body
    const update = {}
    if (title !== undefined) update.title = title
    if (content !== undefined) update.content = content
    if (tags !== undefined) update.tags = tags
    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      update,
      { new: true }
    )
    res.json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update note' })
  }
})

// Toggle pin
router.patch('/:noteId/pin', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.pinned = !note.pinned
    await note.save()
    res.json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to toggle pin' })
  }
})

// Delete
router.delete('/:noteId', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.noteId)
    res.sendStatus(204)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete note' })
  }
})

export default router
