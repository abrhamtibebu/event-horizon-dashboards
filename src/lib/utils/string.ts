/**
 * Decodes HTML entities in a string.
 * Specifically handles &amp; -> & but can be expanded.
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
    if (!str) return '';

    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}
