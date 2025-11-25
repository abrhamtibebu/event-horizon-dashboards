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
  Undo,
  Redo,
  ChevronRight,
  Tag,
  Minus,
  Hexagon,
  Table,
  Layers,
  Sparkles,
  GripVertical,
} from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { uploadImageToCanvas, validateImageFile } from '@/lib/badge-designer/utils/imageUpload'
import { AVAILABLE_FIELDS } from '@/lib/badge-designer/utils/dynamicFields'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function Toolbar() {
  const { addElement, undo, redo, canUndo, canRedo } = useBadgeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDynamicFields, setShowDynamicFields] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('elements')
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }
  
  const handleAddDynamicField = (field: string, label: string) => {
    if (field === '{attendee.uuid}') {
      addElement({
        id: crypto.randomUUID(),
        type: 'qr',
        properties: {
          qrData: field,
          size: 150,
          left: 50,
          top: 50,
          scaleX: 1,
          scaleY: 1,
        },
      })
      toast.success(`Added ${label} as QR Code`)
    } else {
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
  
  const handleAddEllipse = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'shape',
      properties: {
        shapeType: 'ellipse',
        width: 120,
        height: 80,
        fill: '#cccccc',
        left: 50,
        top: 50,
      },
    })
  }
  
  const handleAddLine = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'line',
      properties: {
        lineType: 'straight',
        startX: 50,
        startY: 50,
        endX: 150,
        endY: 50,
        stroke: '#000000',
        strokeWidth: 2,
        left: 50,
        top: 50,
        width: 100,
        height: 0,
      },
    })
  }
  
  const handleAddArrow = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'line',
      properties: {
        lineType: 'arrow',
        startX: 50,
        startY: 50,
        endX: 150,
        endY: 50,
        arrowHead: true,
        stroke: '#000000',
        strokeWidth: 2,
        left: 50,
        top: 50,
        width: 100,
        height: 0,
      },
    })
  }
  
  const handleAddPolygon = (sides: number) => {
    addElement({
      id: crypto.randomUUID(),
      type: 'polygon',
      properties: {
        sides,
        radius: 50,
        fill: '#cccccc',
        left: 50,
        top: 50,
        width: 100,
        height: 100,
      },
    })
  }
  
  const handleAddTable = () => {
    addElement({
      id: crypto.randomUUID(),
      type: 'table',
      properties: {
        rows: 3,
        columns: 3,
        width: 300,
        height: 150,
        left: 50,
        top: 50,
        cells: [],
      },
    })
    toast.success('Table added. Edit cells in properties panel.')
  }
  
  const handleGroupSelected = () => {
    const { elements, selectedElementIds } = useBadgeStore.getState()
    if (selectedElementIds.length < 2) {
      toast.error('Select at least 2 elements to group')
      return
    }
    
    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id))
    if (selectedElements.length < 2) {
      toast.error('Select at least 2 elements to group')
      return
    }
    
    const groupId = crypto.randomUUID()
    addElement({
      id: groupId,
      type: 'group',
      properties: {
        children: selectedElementIds,
        left: Math.min(...selectedElements.map(el => el.properties.left || 0)),
        top: Math.min(...selectedElements.map(el => el.properties.top || 0)),
      },
    })
    
    selectedElements.forEach(el => {
      useBadgeStore.getState().updateElement(el.id, { groupId }, true)
    })
    
    toast.success('Elements grouped')
  }
  
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Design Tools
          </h3>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {/* Elements Section */}
            <div>
              <button
                onClick={() => toggleSection('elements')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Elements</span>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  expandedSection === 'elements' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'elements' && (
                <div className="mt-2 space-y-1 pl-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddText}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Type className="h-4 w-4" />
                        <span className="text-sm">Text</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add text element</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddQR}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <QrCode className="h-4 w-4" />
                        <span className="text-sm">QR Code</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add QR code</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddImage}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm">Image</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload image</TooltipContent>
                  </Tooltip>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            {/* Shapes Section */}
            <div>
              <button
                onClick={() => toggleSection('shapes')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Shapes</span>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  expandedSection === 'shapes' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'shapes' && (
                <div className="mt-2 space-y-1 pl-2 grid grid-cols-2 gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddRectangle}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Square className="h-4 w-4" />
                        <span className="text-sm">Rect</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rectangle</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddCircle}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Circle className="h-4 w-4" />
                        <span className="text-sm">Circle</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Circle</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddEllipse}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Circle className="h-4 w-4" />
                        <span className="text-sm">Ellipse</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ellipse</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleAddPolygon(3)}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Hexagon className="h-4 w-4" />
                        <span className="text-sm">Triangle</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Triangle</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleAddPolygon(6)}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Hexagon className="h-4 w-4" />
                        <span className="text-sm">Hexagon</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hexagon</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            {/* Lines Section */}
            <div>
              <button
                onClick={() => toggleSection('lines')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Lines</span>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  expandedSection === 'lines' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'lines' && (
                <div className="mt-2 space-y-1 pl-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddLine}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Minus className="h-4 w-4" />
                        <span className="text-sm">Line</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Straight line</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddArrow}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Minus className="h-4 w-4" />
                        <span className="text-sm">Arrow</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Arrow line</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            {/* Advanced Section */}
            <div>
              <button
                onClick={() => toggleSection('advanced')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Advanced</span>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  expandedSection === 'advanced' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'advanced' && (
                <div className="mt-2 space-y-1 pl-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddTable}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Table className="h-4 w-4" />
                        <span className="text-sm">Table</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add table</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleGroupSelected}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                      >
                        <Layers className="h-4 w-4" />
                        <span className="text-sm">Group</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Group selected elements</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            {/* Dynamic Fields Section */}
            <div>
              <button
                onClick={() => toggleSection('fields')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dynamic Fields</span>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  expandedSection === 'fields' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'fields' && (
                <div className="mt-2 space-y-1 pl-2">
                  {AVAILABLE_FIELDS.map((field) => (
                    <Tooltip key={field.value}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => handleAddDynamicField(field.value, field.label)}
                        >
                          <Tag className="h-3 w-3" />
                          {field.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{field.value}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
