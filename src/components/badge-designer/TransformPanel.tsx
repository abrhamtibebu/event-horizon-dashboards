import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RotateCw, FlipHorizontal, FlipVertical, RotateCcw } from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'

export function TransformPanel() {
  const { elements, activeElementId, updateElement } = useBadgeStore()
  const activeElement = elements.find(el => el.id === activeElementId)
  
  if (!activeElement) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Select an element to transform it
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
  
  const flipHorizontal = () => {
    const currentScaleX = activeElement.properties.scaleX || 1
    handlePropertyChange('scaleX', -currentScaleX)
  }
  
  const flipVertical = () => {
    const currentScaleY = activeElement.properties.scaleY || 1
    handlePropertyChange('scaleY', -currentScaleY)
  }
  
  const rotate = (degrees: number) => {
    const currentAngle = activeElement.properties.angle || 0
    handlePropertyChange('angle', (currentAngle + degrees) % 360)
  }
  
  const resetTransform = () => {
    handlePropertyChange('angle', 0)
    handlePropertyChange('scaleX', 1)
    handlePropertyChange('scaleY', 1)
  }
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Transform</h3>
      
      <Separator />
      
      {/* Position */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>X Position</Label>
          <Input
            type="number"
            value={Math.round(activeElement.properties.left || 0)}
            onChange={(e) => handlePropertyChange('left', Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Y Position</Label>
          <Input
            type="number"
            value={Math.round(activeElement.properties.top || 0)}
            onChange={(e) => handlePropertyChange('top', Number(e.target.value))}
          />
        </div>
      </div>
      
      {/* Size */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Width</Label>
          <Input
            type="number"
            value={Math.round(activeElement.properties.width || 100)}
            onChange={(e) => handlePropertyChange('width', Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Height</Label>
          <Input
            type="number"
            value={Math.round(activeElement.properties.height || 100)}
            onChange={(e) => handlePropertyChange('height', Number(e.target.value))}
          />
        </div>
      </div>
      
      {/* Rotation */}
      <div className="space-y-2">
        <Label>Rotation: {Math.round(activeElement.properties.angle || 0)}°</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={Math.round(activeElement.properties.angle || 0)}
            onChange={(e) => handlePropertyChange('angle', Number(e.target.value))}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => rotate(-90)}
            title="Rotate -90°"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => rotate(90)}
            title="Rotate +90°"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Scale */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Scale X: {((activeElement.properties.scaleX || 1) * 100).toFixed(0)}%</Label>
          <Input
            type="number"
            step={0.1}
            value={activeElement.properties.scaleX || 1}
            onChange={(e) => handlePropertyChange('scaleX', Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Scale Y: {((activeElement.properties.scaleY || 1) * 100).toFixed(0)}%</Label>
          <Input
            type="number"
            step={0.1}
            value={activeElement.properties.scaleY || 1}
            onChange={(e) => handlePropertyChange('scaleY', Number(e.target.value))}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Flip & Reset */}
      <div className="space-y-2">
        <Label>Actions</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={flipHorizontal}
            className="flex-1"
            title="Flip Horizontal"
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={flipVertical}
            className="flex-1"
            title="Flip Vertical"
          >
            <FlipVertical className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetTransform}
          className="w-full"
        >
          Reset Transform
        </Button>
      </div>
    </div>
  )
}





