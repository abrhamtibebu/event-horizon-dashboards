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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { DynamicFieldPicker } from './DynamicFieldPicker'
import { RichTextEditor } from './RichTextEditor'
import { TextEffectsPanel } from './TextEffectsPanel'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
          <Settings className="h-4 w-4 text-purple-600" />
          Properties
        </h3>
        <p className="text-xs text-gray-500 mt-1 capitalize">
          Editing: {activeElement.type}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
        {/* Text Properties */}
        {activeElement.type === 'text' && (
          <>
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Text Content</Label>
                  <RichTextEditor
                    value={activeElement.properties.content || ''}
                    onChange={(html) => {
                      // Extract plain text from HTML for storage
                      const tempDiv = document.createElement('div')
                      tempDiv.innerHTML = html
                      const plainText = tempDiv.textContent || tempDiv.innerText || ''
                      handlePropertyChange('content', plainText)
                    }}
                    placeholder="Enter text..."
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
              </TabsContent>
              
              <TabsContent value="style" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <Select
                      value={String(activeElement.properties.fontWeight || 'normal')}
                      onValueChange={(value) => handlePropertyChange('fontWeight', value === 'normal' ? 'normal' : value === 'bold' ? 'bold' : Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                        <SelectItem value="700">700</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="900">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Font Style</Label>
                    <Select
                      value={activeElement.properties.fontStyle || 'normal'}
                      onValueChange={(value) => handlePropertyChange('fontStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                        <SelectItem value="oblique">Oblique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Line Height: {activeElement.properties.lineHeight || 1.5}</Label>
                    <Slider
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={[activeElement.properties.lineHeight || 1.5]}
                      onValueChange={([height]) => handlePropertyChange('lineHeight', height)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Letter Spacing: {activeElement.properties.letterSpacing || 0}px</Label>
                    <Slider
                      min={-5}
                      max={20}
                      step={0.5}
                      value={[activeElement.properties.letterSpacing || 0]}
                      onValueChange={([spacing]) => handlePropertyChange('letterSpacing', spacing)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="effects" className="mt-4">
                <TextEffectsPanel />
              </TabsContent>
            </Tabs>
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
        
        {/* Line Properties */}
        {activeElement.type === 'line' && (
          <>
            <div className="space-y-2">
              <Label>Line Type</Label>
              <Select
                value={activeElement.properties.lineType || 'straight'}
                onValueChange={(value) => handlePropertyChange('lineType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="arrow">Arrow</SelectItem>
                  <SelectItem value="curved">Curved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={activeElement.properties.stroke || activeElement.properties.fill || '#000000'}
                  onChange={(e) => {
                    handlePropertyChange('stroke', e.target.value)
                    handlePropertyChange('fill', e.target.value)
                  }}
                  className="w-20 h-10"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={activeElement.properties.stroke || activeElement.properties.fill || '#000000'}
                  onChange={(e) => {
                    handlePropertyChange('stroke', e.target.value)
                    handlePropertyChange('fill', e.target.value)
                  }}
                  className="flex-1"
                  placeholder="#000000"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Stroke Width: {activeElement.properties.strokeWidth || 2}px</Label>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[activeElement.properties.strokeWidth || 2]}
                onValueChange={([width]) => handlePropertyChange('strokeWidth', width)}
              />
            </div>
            
            {(activeElement.properties.lineType === 'arrow') && (
              <div className="space-y-2">
                <Label>Arrow Options</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeElement.properties.arrowHead || false}
                    onChange={(e) => handlePropertyChange('arrowHead', e.target.checked)}
                    className="rounded"
                  />
                  <Label className="text-sm">Arrow Head</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeElement.properties.arrowTail || false}
                    onChange={(e) => handlePropertyChange('arrowTail', e.target.checked)}
                    className="rounded"
                  />
                  <Label className="text-sm">Arrow Tail</Label>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Polygon Properties */}
        {activeElement.type === 'polygon' && (
          <>
            <div className="space-y-2">
              <Label>Number of Sides: {activeElement.properties.sides || 5}</Label>
              <Slider
                min={3}
                max={12}
                step={1}
                value={[activeElement.properties.sides || 5]}
                onValueChange={([sides]) => handlePropertyChange('sides', sides)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Radius: {activeElement.properties.radius || 50}px</Label>
              <Slider
                min={10}
                max={200}
                step={5}
                value={[activeElement.properties.radius || 50]}
                onValueChange={([radius]) => handlePropertyChange('radius', radius)}
              />
            </div>
            
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
            
            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={activeElement.properties.stroke || '#000000'}
                  onChange={(e) => handlePropertyChange('stroke', e.target.value)}
                  className="w-20 h-10"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={activeElement.properties.stroke || '#000000'}
                  onChange={(e) => handlePropertyChange('stroke', e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Stroke Width: {activeElement.properties.strokeWidth || 0}px</Label>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[activeElement.properties.strokeWidth || 0]}
                onValueChange={([width]) => handlePropertyChange('strokeWidth', width)}
              />
            </div>
          </>
        )}
        
        {/* Table Properties */}
        {activeElement.type === 'table' && (
          <>
            <div className="space-y-2">
              <Label>Rows: {activeElement.properties.rows || 3}</Label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[activeElement.properties.rows || 3]}
                onValueChange={([rows]) => handlePropertyChange('rows', rows)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Columns: {activeElement.properties.columns || 3}</Label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[activeElement.properties.columns || 3]}
                onValueChange={([columns]) => handlePropertyChange('columns', columns)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Table Width: {activeElement.properties.width || 300}px</Label>
              <Slider
                min={100}
                max={600}
                step={10}
                value={[activeElement.properties.width || 300]}
                onValueChange={([width]) => handlePropertyChange('width', width)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Table Height: {activeElement.properties.height || 150}px</Label>
              <Slider
                min={50}
                max={400}
                step={10}
                value={[activeElement.properties.height || 150]}
                onValueChange={([height]) => handlePropertyChange('height', height)}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Cell content editing coming soon. Use dynamic fields in cell content.
            </p>
          </>
        )}
        
        {/* Group Properties */}
        {activeElement.type === 'group' && (
          <div className="space-y-2">
            <Label>Group</Label>
            <p className="text-sm text-muted-foreground">
              {activeElement.properties.children?.length || 0} elements in this group
            </p>
            <p className="text-xs text-muted-foreground">
              Select individual elements to edit their properties, or ungroup to edit separately.
            </p>
          </div>
        )}
        
        {/* Common Properties for all elements */}
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Position & Transform</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>X Position</Label>
              <Input
                type="number"
                value={Math.round(activeElement.properties.left || 0)}
                onChange={(e) => handlePropertyChange('left', Number(e.target.value))}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Y Position</Label>
              <Input
                type="number"
                value={Math.round(activeElement.properties.top || 0)}
                onChange={(e) => handlePropertyChange('top', Number(e.target.value))}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Rotation: {Math.round(activeElement.properties.angle || 0)}°</Label>
            <Slider
              min={-180}
              max={180}
              step={1}
              value={[activeElement.properties.angle || 0]}
              onValueChange={([angle]) => handlePropertyChange('angle', angle)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Opacity: {Math.round((activeElement.properties.opacity ?? 1) * 100)}%</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round((activeElement.properties.opacity ?? 1) * 100)]}
              onValueChange={([opacity]) => handlePropertyChange('opacity', opacity / 100)}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Dynamic Field Picker */}
        <div className="pt-2">
          <DynamicFieldPicker />
        </div>
      </div>
      </ScrollArea>
    </div>
  )
}


