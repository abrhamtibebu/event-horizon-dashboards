import { find } from 'linkifyjs'

export interface FormattedMessage {
  content: string
  hasLinks: boolean
  hasMentions: boolean
  hasHashtags: boolean
}

/**
 * Detect URLs, mentions, and hashtags in message content
 */
export function detectMessageFormatting(content: string): FormattedMessage {
  const links = find(content, 'url')
  // For mentions and hashtags, we'll use regex since linkifyjs v4 doesn't have separate plugins
  const mentions = content.match(/@\w+/g) || []
  const hashtags = content.match(/#\w+/g) || []

  return {
    content,
    hasLinks: links.length > 0,
    hasMentions: mentions.length > 0,
    hasHashtags: hashtags.length > 0
  }
}

/**
 * Convert plain text links to clickable HTML links
 */
export function linkifyText(text: string): string {
  // Since linkifyjs v4 doesn't have a linkify function, we'll use a simple approach
  const links = find(text, 'url')
  let result = text
  
  links.forEach(link => {
    const linkHtml = `<a href="${link.href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline">${link.value}</a>`
    result = result.replace(link.value, linkHtml)
  })
  
  return result
}

/**
 * Convert @mentions to styled spans
 */
export function formatMentions(text: string): string {
  return text.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium bg-blue-50 px-1 rounded">@$1</span>')
}

/**
 * Convert #hashtags to styled spans
 */
export function formatHashtags(text: string): string {
  return text.replace(/#(\w+)/g, '<span class="text-purple-600 font-medium bg-purple-50 px-1 rounded">#$1</span>')
}

/**
 * Convert basic markdown formatting
 */
export function formatBasicMarkdown(text: string): string {
  // Bold text **text** or __text__
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  text = text.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>')
  
  // Italic text *text* or _text_
  text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
  text = text.replace(/_(.*?)_/g, '<em class="italic">$1</em>')
  
  // Strikethrough ~~text~~
  text = text.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>')
  
  // Inline code `code`
  text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
  
  return text
}

/**
 * Format message content with all formatting options
 */
export function formatMessageContent(content: string): string {
  let formatted = content
  
  // Apply basic markdown formatting first
  formatted = formatBasicMarkdown(formatted)
  
  // Apply mentions formatting
  formatted = formatMentions(formatted)
  
  // Apply hashtags formatting
  formatted = formatHashtags(formatted)
  
  // Apply linkify last to avoid conflicts
  formatted = linkifyText(formatted)
  
  return formatted
}

/**
 * Extract URLs from message content
 */
export function extractUrls(content: string): string[] {
  const links = find(content, 'url')
  return links.map(link => link.href)
}

/**
 * Extract mentions from message content
 */
export function extractMentions(content: string): string[] {
  const mentions = content.match(/@\w+/g) || []
  return mentions
}

/**
 * Extract hashtags from message content
 */
export function extractHashtags(content: string): string[] {
  const hashtags = content.match(/#\w+/g) || []
  return hashtags
}

/**
 * Check if content contains any special formatting
 */
export function hasSpecialFormatting(content: string): boolean {
  const formatting = detectMessageFormatting(content)
  return formatting.hasLinks || formatting.hasMentions || formatting.hasHashtags ||
         /\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|~~.*?~~|`.*?`/.test(content)
}



