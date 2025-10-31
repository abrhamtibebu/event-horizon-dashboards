import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { DynamicFieldPicker } from './DynamicFieldPicker'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'
import { cn } from '@/lib/utils'

const AVAILABLE_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Poppins', label: 'Poppins' },
]

export function PropertiesPanel() {
  const { elements, activeElementId, updateElement } = useBadgeStore()
  const activeElement = elements.find(el => el.id === activeElementId)
  
  if (!activeElement) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Select an element to edit its properties
        </p>
      </div>
    )
  }
  
  const handlePropertyChange = (property: string, value: any) => {
    updateElement(activeElementId!, {
      properties: {
        [property]: value,
      },
    })
  }
  
  return (
    <div className="space-y-4">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Properties</h3>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          Editing: {activeElement.type}
        </p>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Text Properties */}
        {activeElement.type === 'text' && (
          <>
            <div className="space-y-2">
              <Label>Text Content</Label>
              <Textarea
                value={activeElement.properties.content || ''}
                onChange={(e) => handlePropertyChange('content', e.target.value)}
                placeholder="Enter text..."
                className="min-h-[80px] resize-y"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Font Size: {activeElement.properties.fontSize || 24}px</Label>
              <Slider
                min={8}
                max={72}
                step={1}
                value={[activeElement.properties.fontSize || 24]}
                onValueChange={([size]) => handlePropertyChange('fontSize', size)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={activeElement.properties.fontFamily || 'Arial'}
                onValueChange={(font) => handlePropertyChange('fontFamily', font)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map(f => (
                    <SelectItem 
                      key={f.value} 
                      value={f.value}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={activeElement.properties.fill || '#000000'}
                  onChange={(e) => handlePropertyChange('fill', e.target.value)}
                  className="w-20 h-10"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={activeElement.properties.fill || '#000000'}
                  onChange={(e) => handlePropertyChange('fill', e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <div className="flex gap-1">
                <Button
                  variant={activeElement.properties.textAlign === 'left' || !activeElement.properties.textAlign ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePropertyChange('textAlign', 'left')}
                  className="flex-1"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeElement.properties.textAlign === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePropertyChange('textAlign', 'center')}
                  className="flex-1"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeElement.properties.textAlign === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePropertyChange('textAlign', 'right')}
                  className="flex-1"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeElement.properties.textAlign === 'justify' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePropertyChange('textAlign', 'justify')}
                  className="flex-1"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Text Box Width: {activeElement.properties.width || 200}px</Label>
              <Slider
                min={50}
                max={600}
                step={10}
                value={[activeElement.properties.width || 200]}
                onValueChange={([width]) => handlePropertyChange('width', width)}
              />
              <p className="text-xs text-muted-foreground">
                You can also drag the edges on the canvas to resize
              </p>
            </div>
          </>
        )}
        
        {/* QR Code Properties */}
        {activeElement.type === 'qr' && (
          <>
            <div className="space-y-2">
              <Label>QR Code Data</Label>
              <Input
                value={activeElement.properties.qrData || ''}
                onChange={(e) => {
                  handlePropertyChange('qrData', e.target.value)
                  handlePropertyChange('dynamicField', e.target.value)
                }}
                placeholder="Enter data or dynamic field..."
                onKeyDown={(e) => e.stopPropagation()}
              />
              <p className="text-xs text-muted-foreground">
                Use dynamic fields like {'{attendee.uuid}'} for personalized QR codes
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Size: {activeElement.properties.size || 150}px</Label>
              <Slider
                min={50}
                max={300}
                step={10}
                value={[activeElement.properties.size || 150]}
                onValueChange={([size]) => handlePropertyChange('size', size)}
              />
            </div>
          </>
        )}
        
        {/* Shape Properties */}
        {activeElement.type === 'shape' && (
          <>
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={activeElement.properties.fill || '#cccccc'}
                  onChange={(e) => handlePropertyChange('fill', e.target.value)}
                  className="w-20 h-10"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={activeElement.properties.fill || '#cccccc'}
                  onChange={(e) => handlePropertyChange('fill', e.target.value)}
                  className="flex-1"
                  placeholder="#cccccc"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {activeElement.properties.shapeType === 'rectangle' && (
              <>
                <div className="space-y-2">
                  <Label>Width: {activeElement.properties.width || 100}px</Label>
                  <Slider
                    min={10}
                    max={400}
                    step={5}
                    value={[activeElement.properties.width || 100]}
                    onValueChange={([width]) => handlePropertyChange('width', width)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Height: {activeElement.properties.height || 100}px</Label>
                  <Slider
                    min={10}
                    max={600}
                    step={5}
                    value={[activeElement.properties.height || 100]}
                    onValueChange={([height]) => handlePropertyChange('height', height)}
                  />
                </div>
              </>
            )}
          </>
        )}
        
        {/* Image Properties */}
        {activeElement.type === 'image' && (
          <div className="space-y-2">
            <Label>Image</Label>
            <p className="text-sm text-muted-foreground">
              Use the canvas to resize and position the image
            </p>
          </div>
        )}
        
        <Separator />
        
        {/* Dynamic Field Picker */}
        <DynamicFieldPicker />
      </div>
    </div>
  )
}


