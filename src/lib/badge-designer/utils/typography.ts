/**
 * Typography system and utilities
 */

export interface FontPairing {
  heading: string
  body: string
  description: string
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    heading: 'Playfair Display',
    body: 'Open Sans',
    description: 'Elegant and modern',
  },
  {
    heading: 'Montserrat',
    body: 'Lato',
    description: 'Clean and professional',
  },
  {
    heading: 'Raleway',
    body: 'Roboto',
    description: 'Contemporary and readable',
  },
  {
    heading: 'Poppins',
    body: 'Source Sans Pro',
    description: 'Friendly and approachable',
  },
]

export interface TypographyScale {
  h1: number
  h2: number
  h3: number
  h4: number
  body: number
  caption: number
}

export const TYPOGRAPHY_SCALES: Record<string, TypographyScale> = {
  default: {
    h1: 48,
    h2: 36,
    h3: 28,
    h4: 24,
    body: 16,
    caption: 12,
  },
  compact: {
    h1: 36,
    h2: 28,
    h3: 24,
    h4: 20,
    body: 14,
    caption: 10,
  },
  spacious: {
    h1: 60,
    h2: 48,
    h3: 36,
    h4: 28,
    body: 18,
    caption: 14,
  },
}

export interface TextStylePreset {
  name: string
  fontSize: number
  fontFamily: string
  fontWeight: string | number
  fontStyle: string
  lineHeight: number
  letterSpacing: number
  color: string
}

export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  {
    name: 'Heading 1',
    fontSize: 48,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: -0.5,
    color: '#000000',
  },
  {
    name: 'Heading 2',
    fontSize: 36,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    fontStyle: 'normal',
    lineHeight: 1.3,
    letterSpacing: -0.3,
    color: '#000000',
  },
  {
    name: 'Body',
    fontSize: 16,
    fontFamily: 'Open Sans',
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.6,
    letterSpacing: 0,
    color: '#000000',
  },
  {
    name: 'Caption',
    fontSize: 12,
    fontFamily: 'Open Sans',
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0.5,
    color: '#666666',
  },
]

export function getFontPairing(index: number): FontPairing {
  return FONT_PAIRINGS[index % FONT_PAIRINGS.length]
}

export function getTypographyScale(name: string = 'default'): TypographyScale {
  return TYPOGRAPHY_SCALES[name] || TYPOGRAPHY_SCALES.default
}

export function getTextStylePreset(name: string): TextStylePreset | null {
  return TEXT_STYLE_PRESETS.find(preset => preset.name === name) || null
}

export function applyTextStylePreset(
  preset: TextStylePreset
): Partial<{
  fontSize: number
  fontFamily: string
  fontWeight: string | number
  fontStyle: string
  lineHeight: number
  letterSpacing: number
  fill: string
}> {
  return {
    fontSize: preset.fontSize,
    fontFamily: preset.fontFamily,
    fontWeight: preset.fontWeight,
    fontStyle: preset.fontStyle,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
    fill: preset.color,
  }
}





