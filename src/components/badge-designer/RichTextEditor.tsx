import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Minus,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onStyleChange?: (styles: TextStyles) => void
  placeholder?: string
  className?: string
}

interface TextStyles {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: number
  letterSpacing?: number
}

export function RichTextEditor({
  value,
  onChange,
  onStyleChange,
  placeholder = 'Enter text...',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [styles, setStyles] = useState<TextStyles>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#000000',
    textAlign: 'left',
  })

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
      
      // Update styles from selection
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer
        
        if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
          const element = container.parentElement as HTMLElement
          const computedStyle = window.getComputedStyle(element)
          
          const newStyles: TextStyles = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough'),
            fontSize: parseInt(computedStyle.fontSize) || 24,
            fontFamily: computedStyle.fontFamily.replace(/['"]/g, '').split(',')[0],
            color: computedStyle.color,
            textAlign: (computedStyle.textAlign as any) || 'left',
            lineHeight: parseFloat(computedStyle.lineHeight) || 1.5,
            letterSpacing: parseFloat(computedStyle.letterSpacing) || 0,
          }
          
          setStyles(newStyles)
          onStyleChange?.(newStyles)
        }
      }
    }
  }

  const handleInput = () => {
    updateContent()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    updateContent()
  }

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          variant={styles.bold ? 'default' : 'ghost'}
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={styles.italic ? 'default' : 'ghost'}
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={styles.underline ? 'default' : 'ghost'}
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={styles.strikethrough ? 'default' : 'ghost'}
          size="sm"
          onClick={() => execCommand('strikeThrough')}
          className="h-8 w-8 p-0"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button
          type="button"
          variant={styles.textAlign === 'left' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            execCommand('justifyLeft')
            setStyles({ ...styles, textAlign: 'left' })
          }}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={styles.textAlign === 'center' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            execCommand('justifyCenter')
            setStyles({ ...styles, textAlign: 'center' })
          }}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={styles.textAlign === 'right' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            execCommand('justifyRight')
            setStyles({ ...styles, textAlign: 'right' })
          }}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={styles.textAlign === 'justify' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            execCommand('justifyFull')
            setStyles({ ...styles, textAlign: 'justify' })
          }}
          className="h-8 w-8 p-0"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onBlur={updateContent}
        className="min-h-[120px] p-3 focus:outline-none focus:ring-2 focus:ring-primary"
        style={{
          fontFamily: styles.fontFamily,
          fontSize: `${styles.fontSize}px`,
          color: styles.color,
          textAlign: styles.textAlign,
          lineHeight: styles.lineHeight,
          letterSpacing: `${styles.letterSpacing}px`,
        }}
        data-placeholder={placeholder}
      />
      
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}





