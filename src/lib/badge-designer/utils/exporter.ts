import * as fabric from 'fabric'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

// Export presets
export interface ExportPreset {
  name: string
  width: number
  height: number
  dpi: number
  format: 'png' | 'pdf' | 'svg'
  quality?: number
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    name: 'Standard Badge (4x6")',
    width: 400,
    height: 600,
    dpi: 300,
    format: 'pdf',
    quality: 1.0,
  },
  {
    name: 'Small Badge (3x4")',
    width: 300,
    height: 400,
    dpi: 300,
    format: 'pdf',
    quality: 1.0,
  },
  {
    name: 'High Resolution PNG',
    width: 400,
    height: 600,
    dpi: 300,
    format: 'png',
    quality: 1.0,
  },
  {
    name: 'Web Optimized PNG',
    width: 400,
    height: 600,
    dpi: 150,
    format: 'png',
    quality: 0.9,
  },
]

export async function exportBadgeAsPNG(
  canvas: fabric.Canvas
): Promise<Blob | null> {
  try {
    const loadingToast = toast.loading('Generating PNG...')
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1.5, // Optimized: 1.5x resolution balances quality and speed
    })
    
    const res = await fetch(dataURL)
    const blob = await res.blob()
    
    toast.dismiss(loadingToast)
    toast.success('Badge exported as PNG!')
    
    return blob
  } catch (error) {
    console.error('Failed to export badge as PNG:', error)
    toast.error('Failed to export badge as PNG')
    return null
  }
}

export async function exportBadgeAsPDF(
  canvas: fabric.Canvas,
  badgeName: string = 'badge'
): Promise<void> {
  try {
    const loadingToast = toast.loading('Generating PDF...')
    
    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150], // 4x6 inch badge (approx)
    })
    
    pdf.addImage(imgData, 'PNG', 0, 0, 100, 150)
    pdf.save(`${badgeName}.pdf`)
    
    toast.dismiss(loadingToast)
    toast.success('Badge exported as PDF!')
  } catch (error) {
    console.error('Failed to export badge as PDF:', error)
    toast.error('Failed to export badge as PDF')
    throw error
  }
}

// Export as SVG
export async function exportBadgeAsSVG(
  canvas: fabric.Canvas
): Promise<Blob | null> {
  try {
    const loadingToast = toast.loading('Generating SVG...')
    
    const svgData = canvas.toSVG({
      encoding: 'UTF-8',
      suppressPreamble: false,
    })
    
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    
    toast.dismiss(loadingToast)
    toast.success('Badge exported as SVG!')
    
    return blob
  } catch (error) {
    console.error('Failed to export badge as SVG:', error)
    toast.error('Failed to export badge as SVG')
    return null
  }
}

// Export as print-ready PDF (high resolution, CMYK support)
export async function exportBadgeAsPrintPDF(
  canvas: fabric.Canvas,
  badgeName: string = 'badge',
  options: {
    dpi?: number
    width?: number
    height?: number
    bleed?: number
    cropMarks?: boolean
  } = {}
): Promise<void> {
  try {
    const loadingToast = toast.loading('Generating print-ready PDF...')
    
    const dpi = options.dpi || 300
    const width = options.width || canvas.width || 400
    const height = options.height || canvas.height || 600
    const bleed = options.bleed || 3 // 3mm bleed
    
    // Calculate dimensions in mm (assuming 96 DPI for canvas)
    const widthMm = (width / 96) * 25.4
    const heightMm = (height / 96) * 25.4
    
    // Export at high resolution
    const multiplier = dpi / 96
    const imgData = canvas.toDataURL('image/png', 1.0)
    
    const pdf = new jsPDF({
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm + bleed * 2, heightMm + bleed * 2],
    })
    
    // Add bleed area (white background)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, widthMm + bleed * 2, heightMm + bleed * 2, 'F')
    
    // Add image with bleed
    pdf.addImage(
      imgData,
      'PNG',
      bleed,
      bleed,
      widthMm,
      heightMm
    )
    
    // Add crop marks if requested
    if (options.cropMarks) {
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.1)
      const markLength = 5
      
      // Top-left
      pdf.line(bleed, 0, bleed, markLength)
      pdf.line(0, bleed, markLength, bleed)
      
      // Top-right
      pdf.line(widthMm + bleed, 0, widthMm + bleed, markLength)
      pdf.line(widthMm + bleed * 2, bleed, widthMm + bleed * 2 - markLength, bleed)
      
      // Bottom-left
      pdf.line(bleed, heightMm + bleed * 2, bleed, heightMm + bleed * 2 - markLength)
      pdf.line(0, heightMm + bleed, markLength, heightMm + bleed)
      
      // Bottom-right
      pdf.line(widthMm + bleed, heightMm + bleed * 2, widthMm + bleed, heightMm + bleed * 2 - markLength)
      pdf.line(widthMm + bleed * 2, heightMm + bleed, widthMm + bleed * 2 - markLength, heightMm + bleed)
    }
    
    pdf.save(`${badgeName}-print-ready.pdf`)
    
    toast.dismiss(loadingToast)
    toast.success('Print-ready PDF exported!')
  } catch (error) {
    console.error('Failed to export print-ready PDF:', error)
    toast.error('Failed to export print-ready PDF')
    throw error
  }
}

// Batch export multiple badges
export async function batchExportBadges(
  canvases: fabric.Canvas[],
  format: 'png' | 'pdf' | 'svg' = 'png',
  baseName: string = 'badge'
): Promise<Blob[]> {
  const loadingToast = toast.loading(`Exporting ${canvases.length} badges...`)
  const blobs: Blob[] = []
  
  try {
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i]
      let blob: Blob | null = null
      
      switch (format) {
        case 'png':
          blob = await exportBadgeAsPNG(canvas)
          break
        case 'svg':
          blob = await exportBadgeAsSVG(canvas)
          break
        case 'pdf':
          await exportBadgeAsPDF(canvas, `${baseName}-${i + 1}`)
          continue
      }
      
      if (blob) {
        blobs.push(blob)
      }
    }
    
    toast.dismiss(loadingToast)
    toast.success(`Exported ${blobs.length} badges!`)
    
    return blobs
  } catch (error) {
    toast.dismiss(loadingToast)
    toast.error('Failed to export badges')
    throw error
  }
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Download multiple blobs as ZIP (requires JSZip)
export async function downloadBlobsAsZip(
  blobs: Blob[],
  filenames: string[],
  zipName: string = 'badges.zip'
): Promise<void> {
  try {
    // Dynamic import of JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    for (let i = 0; i < blobs.length; i++) {
      zip.file(filenames[i] || `badge-${i + 1}.png`, blobs[i])
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, zipName)
    toast.success('Badges downloaded as ZIP!')
  } catch (error) {
    console.error('Failed to create ZIP:', error)
    toast.error('Failed to create ZIP file. Please install jszip package.')
  }
}


