declare module 'dompurify' {
  interface Config {
    ALLOWED_TAGS?: string[]
    ALLOWED_ATTR?: string[]
    FORBID_TAGS?: string[]
    FORBID_ATTR?: string[]
    [key: string]: unknown
  }

  interface DOMPurifyInstance {
    sanitize(dirty: string, config?: Config): string
  }

  const DOMPurify: DOMPurifyInstance
  export default DOMPurify
}
