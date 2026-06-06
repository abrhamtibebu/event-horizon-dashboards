import * as React from 'react'
import { cn } from '@/lib/utils'
import { isProbablyHtml, stripDangerousTags } from '@/lib/rich-text'

interface EventDescriptionProps {
  description: string | null | undefined
  className?: string
  /**
   * Tailwind text classes applied to the rendered description. Use this to match
   * the surrounding context (e.g. text-slate-600 dark:text-slate-400).
   */
  textClassName?: string
}

/**
 * Render an event description respecting:
 *   - Shift+Enter line breaks (plain-text → whitespace-pre-line, HTML → <br>)
 *   - Bold / italic produced by the RichTextEditor (<strong>, <em>)
 *
 * Mirrors the renderer used on evella.et for visual consistency.
 */
export function EventDescription({ description, className, textClassName }: EventDescriptionProps) {
  if (!description) return null

  if (isProbablyHtml(description)) {
    return (
      <div
        className={cn(
          'leading-relaxed break-words',
          '[&_strong]:font-semibold [&_b]:font-semibold',
          '[&_em]:italic [&_i]:italic',
          '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
          textClassName,
          className,
        )}
        dangerouslySetInnerHTML={{ __html: stripDangerousTags(description) }}
      />
    )
  }

  return (
    <div className={cn('whitespace-pre-line leading-relaxed break-words', textClassName, className)}>
      {description}
    </div>
  )
}
