import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, FileImage, FileText } from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { replaceDynamicFields } from '@/lib/badge-designer/utils/dynamicFields'
import { exportBadgeAsPNG, exportBadgeAsPDF } from '@/lib/badge-designer/utils/exporter'
import { toast } from 'sonner'
import { BadgePreviewCanvas } from './BadgePreviewCanvas'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  sampleData?: {
    attendee: {
      name: string
      email: string
      company?: string
      jobtitle?: string
      phone?: string
      uuid: string
    }
    event: {
      name: string
      date: string
      location?: string
    }
    guest_type: {
      name: string
    }
  }
}

export function PreviewModal({ open, onClose, sampleData }: PreviewModalProps) {
  const { elements, canvasSize, currentSide, backgroundImage } = useBadgeStore()
  const [exporting, setExporting] = useState(false)
  
  const defaultSampleData = {
    attendee: {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Tech Corp',
      jobtitle: 'Software Engineer',
      phone: '+251 911 234 567',
      uuid: 'sample-uuid-123456',
    },
    event: {
      name: 'Sample Event 2024',
      date: '2024-12-31',
      location: 'Addis Ababa, Ethiopia',
    },
    guest_type: {
      name: 'VIP',
    },
  }
  
  const data = sampleData || defaultSampleData
  
  // Replace dynamic fields in elements for preview
  const previewElements = elements.map((el) => {
    if (el.type === 'text' && el.properties.content) {
      return {
        ...el,
        properties: {
          ...el.properties,
          content: replaceDynamicFields(el.properties.content, data),
        },
      }
    }
    if (el.type === 'qr' && el.properties.qrData) {
      return {
        ...el,
        properties: {
          ...el.properties,
          qrData: replaceDynamicFields(el.properties.qrData, data),
        },
      }
    }
    return el
  })
  
  const handleExportPNG = async () => {
    setExporting(true)
    try {
      // Find the preview canvas element
      const previewCanvas = document.querySelector('.badge-preview-canvas canvas') as HTMLCanvasElement
      
      if (!previewCanvas) {
        toast.error('Preview canvas not found')
        return
      }
      
      // Export the canvas as PNG
      const dataUrl = previewCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `badge-preview-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      
      toast.success('Badge exported as PNG!')
    } catch (error) {
      console.error('Failed to export badge as PNG:', error)
      toast.error('Failed to export badge as PNG')
    } finally {
      setExporting(false)
    }
  }
  
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      // Find the preview canvas element
      const previewCanvas = document.querySelector('.badge-preview-canvas canvas') as HTMLCanvasElement
      
      if (!previewCanvas) {
        toast.error('Preview canvas not found')
        return
      }
      
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf')
      
      // Get canvas data
      const imgData = previewCanvas.toDataURL('image/png')
      const imgWidth = canvasSize.width
      const imgHeight = canvasSize.height
      
      // Create PDF (dimensions in mm, assuming 96 DPI)
      const mmWidth = (imgWidth / 96) * 25.4
      const mmHeight = (imgHeight / 96) * 25.4
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight],
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight)
      pdf.save(`badge-preview-${Date.now()}.pdf`)
      
      toast.success('Badge exported as PDF!')
    } catch (error) {
      console.error('Failed to export badge as PDF:', error)
      toast.error('Failed to export badge as PDF')
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Badge Preview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sample Data Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Sample Data</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Name:</span> {data.attendee.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {data.attendee.email}
              </div>
              <div>
                <span className="font-medium">Company:</span> {data.attendee.company}
              </div>
              <div>
                <span className="font-medium">Job Title:</span> {data.attendee.jobtitle}
              </div>
              <div>
                <span className="font-medium">Event:</span> {data.event.name}
              </div>
              <div>
                <span className="font-medium">Guest Type:</span> {data.guest_type.name}
              </div>
            </div>
          </div>
          
          {/* Preview Area */}
          <div className="flex justify-center p-8 bg-gray-100 rounded-lg">
            <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 badge-preview-canvas">
              {elements.length > 0 ? (
                <BadgePreviewCanvas
                  elements={elements}
                  sampleData={data}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  backgroundImage={backgroundImage[currentSide]}
                />
              ) : (
                <div className="w-[400px] h-[600px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>No elements to preview</p>
                    <p className="text-xs mt-2">
                      Add elements to the badge to see the preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={handleExportPNG} 
            disabled={exporting}
          >
            <FileImage className="h-4 w-4" />
            <span className="ml-2">Export PNG</span>
          </Button>
          <Button 
            onClick={handleExportPDF} 
            disabled={exporting}
          >
            <FileText className="h-4 w-4" />
            <span className="ml-2">Export PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


