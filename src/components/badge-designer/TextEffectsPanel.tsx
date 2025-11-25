import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { Palette, Layers, Type } from 'lucide-react'

export function TextEffectsPanel() {
  const { elements, activeElementId, updateElement } = useBadgeStore()
  const activeElement = elements.find(el => el.id === activeElementId)
  
  if (!activeElement || activeElement.type !== 'text') {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Select a text element to apply effects
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
  
  const textShadow = activeElement.properties.textShadow || {
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    color: '#000000',
  }
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Type className="h-4 w-4" />
        <h3 className="font-semibold">Text Effects</h3>
      </div>
      
      <Separator />
      
      {/* Text Shadow */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <Label className="font-semibold">Text Shadow</Label>
        </div>
        
        <div className="space-y-2">
          <Label>Shadow Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={textShadow.color || '#000000'}
              onChange={(e) => handlePropertyChange('textShadow', {
                ...textShadow,
                color: e.target.value,
              })}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={textShadow.color || '#000000'}
              onChange={(e) => handlePropertyChange('textShadow', {
                ...textShadow,
                color: e.target.value,
              })}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Offset X: {textShadow.offsetX || 0}px</Label>
            <Slider
              min={-20}
              max={20}
              step={1}
              value={[textShadow.offsetX || 0]}
              onValueChange={([x]) => handlePropertyChange('textShadow', {
                ...textShadow,
                offsetX: x,
              })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Offset Y: {textShadow.offsetY || 0}px</Label>
            <Slider
              min={-20}
              max={20}
              step={1}
              value={[textShadow.offsetY || 0]}
              onValueChange={([y]) => handlePropertyChange('textShadow', {
                ...textShadow,
                offsetY: y,
              })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Blur: {textShadow.blur || 0}px</Label>
          <Slider
            min={0}
            max={20}
            step={1}
            value={[textShadow.blur || 0]}
            onValueChange={([blur]) => handlePropertyChange('textShadow', {
              ...textShadow,
              blur,
            })}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePropertyChange('textShadow', null)}
          className="w-full"
        >
          Remove Shadow
        </Button>
      </div>
      
      <Separator />
      
      {/* Line Height */}
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
      
      {/* Letter Spacing */}
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
      
      {/* Text Decoration */}
      <div className="space-y-2">
        <Label>Text Decoration</Label>
        <Select
          value={activeElement.properties.textDecoration || 'none'}
          onValueChange={(value) => handlePropertyChange('textDecoration', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="underline">Underline</SelectItem>
            <SelectItem value="overline">Overline</SelectItem>
            <SelectItem value="line-through">Line Through</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}


