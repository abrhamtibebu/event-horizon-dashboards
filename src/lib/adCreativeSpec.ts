/** Must match backend AdCreativeDimensionRules::canonicalSizes() */
export const CANONICAL_AD_SIZES = [
  { width: 300, height: 250, name: 'Medium rectangle' },
  { width: 336, height: 280, name: 'Large rectangle' },
  { width: 728, height: 90, name: 'Leaderboard' },
  { width: 970, height: 90, name: 'Large leaderboard' },
  { width: 300, height: 600, name: 'Half-page' },
  { width: 320, height: 100, name: 'Large mobile banner' },
] as const

export const ALLOWED_AD_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'] as const

export const AD_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif'

/** API / DB may send numeric fields as strings; always coerce before comparing to decoded image pixels. */
export function normalizeSlotDimensions(
  width: number | string | null | undefined,
  height: number | string | null | undefined,
): { w: number; h: number } | null {
  if (width == null || height == null) return null
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null
  return { w, h }
}

export function isCanonicalSize(width: number, height: number): boolean {
  return CANONICAL_AD_SIZES.some((s) => s.width === width && s.height === height)
}

export function formatSizeLine(
  width: number | string | null | undefined,
  height: number | string | null | undefined,
): string {
  const dims = normalizeSlotDimensions(width, height)
  if (!dims) return 'Set slot dimensions to an IAB size'
  const hit = CANONICAL_AD_SIZES.find((s) => s.width === dims.w && s.height === dims.h)
  const label = hit ? ` (${hit.name})` : ''
  return `Exactly ${dims.w}×${dims.h}px${label}`
}

export function assertRasterFileType(file: File): string | null {
  const name = file.name.toLowerCase()
  const okExt = ALLOWED_AD_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
  const okMime =
    file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
  if (!okExt && !okMime) return 'File must be JPEG, PNG, or GIF.'
  return null
}

export function readImageFileDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

export async function validateAdImageFileForSlot(
  file: File,
  slotWidth: number | string | null | undefined,
  slotHeight: number | string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const typeErr = assertRasterFileType(file)
  if (typeErr) return { ok: false, error: typeErr }
  const slot = normalizeSlotDimensions(slotWidth, slotHeight)
  if (!slot) {
    return { ok: false, error: 'This slot has no width/height set. Sync presets or edit the slot.' }
  }
  if (!isCanonicalSize(slot.w, slot.h)) {
    return { ok: false, error: 'Slot dimensions are not a standard IAB size.' }
  }
  let dims: { width: number; height: number }
  try {
    dims = await readImageFileDimensions(file)
  } catch {
    return { ok: false, error: 'Could not read image dimensions from this file.' }
  }
  if (dims.width !== slot.w || dims.height !== slot.h) {
    return {
      ok: false,
      error: `Dimension mismatch: your image is ${dims.width}×${dims.height}px; this slot requires exactly ${slot.w}×${slot.h}px.`,
    }
  }
  return { ok: true }
}

/** Best-effort URL check (may fail on CORS); server still validates. */
export function probeImageUrlDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not load image URL'))
    img.src = url
  })
}

export async function validateAdImageUrlForSlot(
  url: string,
  slotWidth: number | string | null | undefined,
  slotHeight: number | string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false, error: 'Image URL is empty.' }
  const slot = normalizeSlotDimensions(slotWidth, slotHeight)
  if (!slot) {
    return { ok: false, error: 'This slot has no width/height set.' }
  }
  try {
    const dims = await probeImageUrlDimensions(trimmed)
    if (dims.width !== slot.w || dims.height !== slot.h) {
      return {
        ok: false,
        error: `Dimension mismatch: URL image is ${dims.width}×${dims.height}px; this slot requires exactly ${slot.w}×${slot.h}px.`,
      }
    }
  } catch {
    return {
      ok: false,
      error:
        'Could not verify image URL in the browser (CORS or invalid URL). Save anyway only if you are sure; the server will re-check.',
    }
  }
  return { ok: true }
}
