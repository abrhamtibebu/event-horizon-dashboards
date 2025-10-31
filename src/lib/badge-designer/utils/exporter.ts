import * as fabric from 'fabric'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

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


