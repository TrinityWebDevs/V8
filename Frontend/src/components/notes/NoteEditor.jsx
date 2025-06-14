import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Type as H1Icon,
  Text as H2Icon,
  List as BulletListIcon,
  ListOrdered as OrderedListIcon,
  Link as LinkIcon,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
} from 'lucide-react'

export default function NoteEditor({ content, onUpdate }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-5',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-5',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your note...',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-indigo-600 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      CharacterCount.configure({ limit: 1000000 }),
    ],
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        }
      ]
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onUpdate(json)
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[300px] prose prose-sm dark:prose-invert max-w-none focus:outline-none p-2',
      },
    },
  })

  // Check if a format is active
  const isActive = (format, options = {}) => {
    return editor ? editor.isActive(format, options) : false
  }

  // Link button handler
  const handleLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl || 'https://')
    
    if (url === null) return
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: '_blank' })
        .run()
    }
  }

  // Heading handlers
  const handleHeading1 = () => {
    editor.chain().focus().toggleHeading({ level: 1 }).run()
  }

  const handleHeading2 = () => {
    editor.chain().focus().toggleHeading({ level: 2 }).run()
  }

  // List handlers
  const handleBulletList = () => {
    editor.chain().focus().toggleBulletList().run()
  }

  const handleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run()
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Bold */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${
            isActive('bold')
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Bold"
        >
          <BoldIcon className="w-5 h-5" />
        </button>
        {/* Italic */}
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${
            isActive('italic')
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Italic"
        >
          <ItalicIcon className="w-5 h-5" />
        </button>
        {/* Underline */}
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${
            isActive('underline')
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Underline"
        >
          <UnderlineIcon className="w-5 h-5" />
        </button>
        {/* H1 */}
        <button
          onClick={handleHeading1}
          className={`p-1 rounded ${
            isActive('heading', { level: 1 })
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Heading 1"
        >
          <H1Icon className="w-5 h-5" />
        </button>
        {/* H2 */}
        <button
          onClick={handleHeading2}
          className={`p-1 rounded ${
            isActive('heading', { level: 2 })
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Heading 2"
        >
          <H2Icon className="w-5 h-5" />
        </button>
        {/* Bullet List */}
        <button
          onClick={handleBulletList}
          className={`p-1 rounded ${
            isActive('bulletList')
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Bullet List"
        >
          <BulletListIcon className="w-5 h-5" />
        </button>
        {/* Ordered List */}
        <button
          onClick={handleOrderedList}
          className={`p-1 rounded ${
            isActive('orderedList')
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Numbered List"
        >
          <OrderedListIcon className="w-5 h-5" />
        </button>
        {/* Link */}
        <button
          onClick={handleLink}
          className={`p-1 rounded ${
            isActive('link')
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Add/Edit Link"
        >
          <LinkIcon className="w-5 h-5" />
        </button>
        {/* Align Left */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1 rounded ${
            isActive('textAlign', { align: 'left' })
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Align Left"
        >
          <AlignLeftIcon className="w-5 h-5" />
        </button>
        {/* Align Center */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1 rounded ${
            isActive('textAlign', { align: 'center' })
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Align Center"
        >
          <AlignCenterIcon className="w-5 h-5" />
        </button>
        {/* Align Right */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1 rounded ${
            isActive('textAlign', { align: 'right' })
              ? 'bg-indigo-200 dark:bg-indigo-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={!editor}
          title="Align Right"
        >
          <AlignRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-auto p-4">
        <EditorContent editor={editor} />
      </div>

      {/* Footer: word count */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        Words: {editor ? editor.storage.characterCount.words() : 0}
      </div>
    </div>
  )
}