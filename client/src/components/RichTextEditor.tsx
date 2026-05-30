import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'
import {
  TextB, TextItalic, TextUnderline, ListBullets, ListNumbers,
  LinkSimple, ArrowCounterClockwise, ArrowClockwise,
} from '@phosphor-icons/react'

interface Props {
  value: string
  onChange: (html: string) => void
  minHeight?: string
}

export default function RichTextEditor({ value, onChange, minHeight = '300px' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && value === '') editor.commands.clearContent()
  }, [value, editor])

  if (!editor) return null

  const btn = (onClick: () => void, active: boolean, icon: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/5'
      }`}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/50">
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <TextB size={15} weight="bold" />)}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), <TextItalic size={15} />)}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), <TextUnderline size={15} />)}
        <div className="w-px self-stretch bg-slate-200 dark:bg-white/10 mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), <ListBullets size={15} />)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), <ListNumbers size={15} />)}
        <div className="w-px self-stretch bg-slate-200 dark:bg-white/10 mx-1" />
        {btn(
          () => {
            const url = window.prompt('Enter URL')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          },
          editor.isActive('link'),
          <LinkSimple size={15} />,
        )}
        <div className="w-px self-stretch bg-slate-200 dark:bg-white/10 mx-1" />
        {btn(() => editor.chain().focus().undo().run(), false, <ArrowCounterClockwise size={15} />)}
        {btn(() => editor.chain().focus().redo().run(), false, <ArrowClockwise size={15} />)}
      </div>
      <div className="p-3" style={{ minHeight }}>
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit] prose prose-sm dark:prose-invert max-w-none"
        />
      </div>
    </div>
  )
}
