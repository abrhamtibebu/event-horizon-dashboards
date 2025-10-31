const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Playfair Display',
  'Montserrat',
  'Lato',
  'Raleway',
  'Poppins',
  'Source Sans Pro',
]

export async function loadGoogleFonts(fonts: string[] = GOOGLE_FONTS): Promise<boolean> {
  const WebFont = await import('webfontloader')
  
  return new Promise((resolve) => {
    WebFont.load({
      google: {
        families: fonts,
      },
      active: () => {
        console.log('Fonts loaded successfully')
        resolve(true)
      },
      inactive: () => {
        console.warn('Some fonts failed to load')
        resolve(false)
      },
    })
  })
}

// Custom font registration for Fabric.js
export function registerCustomFont(fontName: string, fontUrl: string): void {
  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('${fontUrl}');
    }
  `
  document.head.appendChild(style)
}

export const AVAILABLE_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
]


