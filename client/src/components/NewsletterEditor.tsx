import { useRef, useMemo } from 'react'
import JoditEditor from 'jodit-react'

interface Props {
  value: string
  onChange: (html: string) => void
  height?: number
}

export default function NewsletterEditor({ value, onChange, height = 420 }: Props) {
  const editor = useRef(null)

  const config = useMemo(
    () => ({
      readonly: false,
      height,
      toolbarAdaptive: false,
      toolbarSticky: false,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html',
      buttons: [
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'font', 'fontsize', 'brush', '|',
        'paragraph', '|',
        'left', 'center', 'right', 'justify', '|',
        'ul', 'ol', '|',
        'link', 'image', 'video', '|',
        'table', 'hr', '|',
        'undo', 'redo', '|',
        'source',
        'fullsize',
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      image: {
        editSrc: true,
        useImageEditor: false,
      },
      style: {
        font: '15px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      },
    }),
    [height]
  )

  return (
    <div className="newsletter-editor-wrap">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={onChange}
      />
    </div>
  )
}
