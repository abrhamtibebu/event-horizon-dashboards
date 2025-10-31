import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Type, 
  Image as ImageIcon, 
  QrCode, 
  Square, 
  Circle,
  Download,
  Undo,
  Redo,
  ChevronRight,
  User,
  Calendar,
  Tag,
} from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { uploadImageToCanvas, validateImageFile } from '@/lib/badge-designer/utils/imageUpload'
import { AVAILABLE_FIELDS } from '@/lib/badge-designer/utils/dynamicFields'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function Toolbar() {
  const { addElement, undo, redo, canUndo, canRedo } = useBadgeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDynamicFields, setShowDynamicFields] = useState(false)
  
  const handleAddDynamicField = (field: string, label: string) => {
    // Special handling for UUID - add as QR code
    if (field === '{attendee.uuid}') {
      addElement({
        id: crypto.randomUUID(),
        type: 'qr',
        properties: {
          qrData: field, // Use the dynamic field as QR data
          size: 150,
          left: 50,
          top: 50,
          scaleX: 1,
          scaleY: 1,
        },
      })
      toast.success(`Added ${label} as QR Code`)
    } else {
      // All other fields are added as text
      addElement({
        id: crypto.randomUUID(),
        type: 'text',
        properties: {
          content: field,
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000',
          textAlign: 'left',
          width: 200,
          left: 50,
          top: 50,
        },
      })
      toast.success(`Added ${label}`)
    }
  }
  
  const handleAddText = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'text',
      properties: {
        content: 'Double-click to edit',
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        textAlign: 'left',
        width: 200,
        left: 50,
        top: 50,
      },
    })
  }
  
  const handleAddQR = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'qr',
      properties: {
        dynamicField: '{attendee.uuid}',
        qrData: 'https://validity.et',
        size: 150,
        left: 50,
        top: 50,
      },
    })
  }
  
  const handleAddImage = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!validateImageFile(file)) {
      toast.error('Invalid image file. Please upload a JPG, PNG, or GIF under 5MB.')
      return
    }
    
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataURL = event.target?.result as string
        addElement({
          id: crypto.randomUUID(),
          type: 'image',
          properties: {
            src: dataURL,
            left: 50,
            top: 50,
          },
        })
      }
      reader.readAsDataURL(file)
      toast.success('Image added to canvas')
    } catch (error) {
      toast.error('Failed to upload image', error)
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleAddRectangle = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'shape',
      properties: {
        shapeType: 'rectangle',
        width: 100,
        height: 100,
        fill: '#cccccc',
        left: 50,
        top: 50,
      },
    })
  }
  
  const handleAddCircle = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'shape',
      properties: {
        shapeType: 'circle',
        width: 100,
        height: 100,
        fill: '#cccccc',
        left: 50,
        top: 50,
      },
    })
  }
  
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Add Elements</h3>
        
        <Button onClick={handleAddText} variant="outline" size="sm" className="justify-start">
          <Type className="h-4 w-4" />
          <span className="ml-2">Add Text</span>
        </Button>
        
        <Button onClick={handleAddQR} variant="outline" size="sm" className="justify-start">
          <QrCode className="h-4 w-4" />
          <span className="ml-2">Add QR Code</span>
        </Button>
        
        <Button onClick={handleAddImage} variant="outline" size="sm" className="justify-start">
          <ImageIcon className="h-4 w-4" />
          <span className="ml-2">Add Image</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <Separator className="my-2" />
        
        {/* Dynamic Fields Section */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDynamicFields(!showDynamicFields)}
            className="w-full justify-start px-2 mb-2"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", showDynamicFields && "rotate-90")} />
            <span className="ml-2 font-semibold text-xs text-muted-foreground">DYNAMIC FIELDS</span>
          </Button>
          
          {showDynamicFields && (
            <div className="space-y-1 pl-2">
              {AVAILABLE_FIELDS.map((field) => (
                <Button
                  key={field.value}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handleAddDynamicField(field.value, field.label)}
                >
                  <Tag className="h-3 w-3 mr-2" />
                  {field.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <Separator className="my-2" />
      
      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Shapes</h3>
      
      <Button onClick={handleAddRectangle} variant="outline" size="sm" className="justify-start">
        <Square className="h-4 w-4" />
        <span className="ml-2">Rectangle</span>
      </Button>
      
      <Button onClick={handleAddCircle} variant="outline" size="sm" className="justify-start">
        <Circle className="h-4 w-4" />
        <span className="ml-2">Circle</span>
      </Button>
      
      <Separator className="my-2" />
      
      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Actions</h3>
      
        <div className="flex gap-2">
          <Button 
            onClick={() => undo()} 
            variant="outline" 
            size="sm"
            disabled={!canUndo()}
            className="flex-1"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={() => redo()} 
            variant="outline" 
            size="sm"
            disabled={!canRedo()}
            className="flex-1"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}


