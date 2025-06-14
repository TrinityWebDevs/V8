import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, default: 'Untitled Note' },
    content: { type: Object, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('Note', noteSchema)
