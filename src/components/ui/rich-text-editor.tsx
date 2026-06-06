import * as React from 'react'
import { Bold, Italic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeRichText, isRichTextEmpty, isProbablyHtml } from '@/lib/rich-text'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  minHeight?: number | string
  id?: string
  disabled?: boolean
  /** Show the small "Shift+Enter for line break · Ctrl+B / Ctrl+I" hint below the editor. */
  showHint?: boolean
  /** Tone the toolbar focus ring to the form's accent color. */
  accentColor?: 'primary' | 'blue' | 'purple' | 'amber' | 'green'
}

const ACCENT_RING: Record<NonNullable<RichTextEditorProps['accentColor']>, string> = {
  primary: 'focus-within:border-primary focus-within:ring-primary/20',
  blue: 'focus-within:border-blue-500 focus-within:ring-blue-500/20',
  purple: 'focus-within:border-purple-500 focus-within:ring-purple-500/20',
  amber: 'focus-within:border-amber-500 focus-within:ring-amber-500/20',
  green: 'focus-within:border-emerald-500 focus-within:ring-emerald-500/20',
}

/**
 * Rich text editor for event descriptions.
 *
 * Why contentEditable instead of a library?
 *   - Browsers natively handle Ctrl/Cmd+B → bold, Ctrl/Cmd+I → italic.
 *   - Shift+Enter natively inserts <br>; Enter inserts a new paragraph.
 *   - Zero new dependencies.
 *
 * Output is HTML (compatible with evella.et's public event page renderer).
 * Plain-text legacy values (no tags) are accepted on input and preserved.
 */
export const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(function RichTextEditor(
  {
    value,
    onChange,
    placeholder = 'Write a description…',
    className,
    editorClassName,
    minHeight = 120,
    id,
    disabled = false,
    showHint = true,
    accentColor = 'primary',
  },
  ref,
) {
  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const lastEmittedRef = React.useRef<string>('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [, force] = React.useReducer((x) => x + 1, 0)

  React.useImperativeHandle(ref, () => editorRef.current as HTMLDivElement)

  // Sync external value -> DOM only when it actually differs from what we last
  // emitted. This avoids resetting the caret on every keystroke.
  React.useEffect(() => {
    const node = editorRef.current
    if (!node) return
    const incoming = value ?? ''
    if (incoming === lastEmittedRef.current) return
    if (node.innerHTML === incoming) return

    // Legacy plain-text descriptions store line breaks as `\n`. HTML collapses
    // raw whitespace, so we convert them to <br> before setting innerHTML.
    // Anything already containing tags is treated as HTML and passed through.
    const html = isProbablyHtml(incoming)
      ? incoming
      : incoming
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\r\n?|\n/g, '<br>')
    node.innerHTML = html
    lastEmittedRef.current = html
  }, [value])

  const emitChange = React.useCallback(() => {
    const node = editorRef.current
    if (!node) return
    const html = sanitizeRichText(node.innerHTML)
    lastEmittedRef.current = html
    onChange(html)
    force()
  }, [onChange])

  const handleInput = React.useCallback(() => {
    emitChange()
  }, [emitChange])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Browser already maps Ctrl/Cmd + B/I to bold/italic inside contentEditable.
      // We don't override that, but we DO call emitChange in the next tick so the
      // controlled `value` stays in sync.
      const mod = event.metaKey || event.ctrlKey
      if (mod && (event.key === 'b' || event.key === 'B' || event.key === 'i' || event.key === 'I')) {
        window.setTimeout(emitChange, 0)
      }
    },
    [emitChange],
  )

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      // Strip rich formatting on paste; preserve only text + line breaks.
      // Users rarely want to paste a Word document's font styling into our form.
      event.preventDefault()
      const text = event.clipboardData.getData('text/plain')
      if (!text) return
      const html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n?|\n/g, '<br>')
      document.execCommand('insertHTML', false, html)
      window.setTimeout(emitChange, 0)
    },
    [emitChange],
  )

  const exec = React.useCallback(
    (command: 'bold' | 'italic') => {
      const node = editorRef.current
      if (!node) return
      node.focus()
      document.execCommand(command, false)
      emitChange()
    },
    [emitChange],
  )

  const showPlaceholder = !isFocused && isRichTextEmpty(value)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'rounded-xl border border-input bg-background shadow-sm transition-colors',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0',
          ACCENT_RING[accentColor],
          disabled && 'opacity-60 pointer-events-none',
        )}
      >
        <div
          className="flex items-center gap-1 border-b border-border/60 px-2 py-1.5"
          role="toolbar"
          aria-label="Text formatting"
        >
          <ToolbarButton
            label="Bold (Ctrl+B)"
            onMouseDown={(e) => {
              e.preventDefault()
              exec('bold')
            }}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic (Ctrl+I)"
            onMouseDown={(e) => {
              e.preventDefault()
              exec('italic')
            }}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <div className="ml-auto text-[10px] text-muted-foreground/70 hidden sm:block">
            Shift+Enter for line break
          </div>
        </div>

        <div className="relative">
          {showPlaceholder && (
            <div className="pointer-events-none absolute inset-0 px-3 py-2.5 text-sm text-muted-foreground select-none">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            id={id}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            spellCheck
            className={cn(
              'w-full px-3 py-2.5 text-sm leading-relaxed outline-none',
              '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
              '[&_strong]:font-semibold [&_b]:font-semibold',
              '[&_em]:italic [&_i]:italic',
              'break-words whitespace-pre-wrap',
              editorClassName,
            )}
            style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
          />
        </div>
      </div>

      {showHint && (
        <p className="text-[11px] text-muted-foreground/80">
          Tip: <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">B</kbd> bold,{' '}
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">I</kbd> italic,{' '}
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Shift</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> line break.
        </p>
      )}
    </div>
  )
})

interface ToolbarButtonProps {
  label: string
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

function ToolbarButton({ label, onMouseDown, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={onMouseDown}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {children}
    </button>
  )
}
