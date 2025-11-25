import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignTop,
  AlignBottom,
  Space,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { toast } from 'sonner'

export function AlignmentToolbar() {
  const { elements, selectedElementIds, updateElement, canvasSize } = useBadgeStore()
  
  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id))
  
  if (selectedElements.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Select elements to align them
        </p>
      </div>
    )
  }
  
  const alignLeft = () => {
    if (selectedElements.length === 0) return
    
    const minLeft = Math.min(...selectedElements.map(el => el.properties.left || 0))
    selectedElements.forEach(el => {
      updateElement(el.id, { properties: { left: minLeft } }, true)
    })
    toast.success('Aligned left')
  }
  
  const alignCenter = () => {
    if (selectedElements.length === 0) return
    
    const bounds = getSelectionBounds(selectedElements)
    const centerX = bounds.left + bounds.width / 2
    
    selectedElements.forEach(el => {
      const elWidth = el.properties.width || 100
      updateElement(el.id, { properties: { left: centerX - elWidth / 2 } }, true)
    })
    toast.success('Aligned center')
  }
  
  const alignRight = () => {
    if (selectedElements.length === 0) return
    
    const maxRight = Math.max(
      ...selectedElements.map(el => (el.properties.left || 0) + (el.properties.width || 100))
    )
    selectedElements.forEach(el => {
      const elWidth = el.properties.width || 100
      updateElement(el.id, { properties: { left: maxRight - elWidth } }, true)
    })
    toast.success('Aligned right')
  }
  
  const alignTop = () => {
    if (selectedElements.length === 0) return
    
    const minTop = Math.min(...selectedElements.map(el => el.properties.top || 0))
    selectedElements.forEach(el => {
      updateElement(el.id, { properties: { top: minTop } }, true)
    })
    toast.success('Aligned top')
  }
  
  const alignMiddle = () => {
    if (selectedElements.length === 0) return
    
    const bounds = getSelectionBounds(selectedElements)
    const centerY = bounds.top + bounds.height / 2
    
    selectedElements.forEach(el => {
      const elHeight = el.properties.height || 100
      updateElement(el.id, { properties: { top: centerY - elHeight / 2 } }, true)
    })
    toast.success('Aligned middle')
  }
  
  const alignBottom = () => {
    if (selectedElements.length === 0) return
    
    const maxBottom = Math.max(
      ...selectedElements.map(el => (el.properties.top || 0) + (el.properties.height || 100))
    )
    selectedElements.forEach(el => {
      const elHeight = el.properties.height || 100
      updateElement(el.id, { properties: { top: maxBottom - elHeight } }, true)
    })
    toast.success('Aligned bottom')
  }
  
  const distributeHorizontally = () => {
    if (selectedElements.length < 3) {
      toast.error('Select at least 3 elements to distribute')
      return
    }
    
    const sorted = [...selectedElements].sort((a, b) => 
      (a.properties.left || 0) - (b.properties.left || 0)
    )
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalWidth = (last.properties.left || 0) + (last.properties.width || 100) - (first.properties.left || 0)
    const spacing = totalWidth / (sorted.length - 1)
    
    sorted.forEach((el, index) => {
      if (index === 0 || index === sorted.length - 1) return
      const elWidth = el.properties.width || 100
      updateElement(el.id, { properties: { left: (first.properties.left || 0) + spacing * index - elWidth / 2 } }, true)
    })
    toast.success('Distributed horizontally')
  }
  
  const distributeVertically = () => {
    if (selectedElements.length < 3) {
      toast.error('Select at least 3 elements to distribute')
      return
    }
    
    const sorted = [...selectedElements].sort((a, b) => 
      (a.properties.top || 0) - (b.properties.top || 0)
    )
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalHeight = (last.properties.top || 0) + (last.properties.height || 100) - (first.properties.top || 0)
    const spacing = totalHeight / (sorted.length - 1)
    
    sorted.forEach((el, index) => {
      if (index === 0 || index === sorted.length - 1) return
      const elHeight = el.properties.height || 100
      updateElement(el.id, { properties: { top: (first.properties.top || 0) + spacing * index - elHeight / 2 } }, true)
    })
    toast.success('Distributed vertically')
  }
  
  const alignToCanvas = (position: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    selectedElements.forEach(el => {
      const elWidth = el.properties.width || 100
      const elHeight = el.properties.height || 100
      
      let left = el.properties.left || 0
      let top = el.properties.top || 0
      
      switch (position) {
        case 'left':
          left = 0
          break
        case 'center':
          left = (canvasSize.width - elWidth) / 2
          break
        case 'right':
          left = canvasSize.width - elWidth
          break
        case 'top':
          top = 0
          break
        case 'middle':
          top = (canvasSize.height - elHeight) / 2
          break
        case 'bottom':
          top = canvasSize.height - elHeight
          break
      }
      
      updateElement(el.id, { properties: { left, top } }, true)
    })
    toast.success(`Aligned to canvas ${position}`)
  }
  
  function getSelectionBounds(elements: typeof selectedElements) {
    if (elements.length === 0) {
      return { left: 0, top: 0, width: 0, height: 0 }
    }
    
    const lefts = elements.map(el => el.properties.left || 0)
    const tops = elements.map(el => el.properties.top || 0)
    const rights = elements.map(el => (el.properties.left || 0) + (el.properties.width || 100))
    const bottoms = elements.map(el => (el.properties.top || 0) + (el.properties.height || 100))
    
    return {
      left: Math.min(...lefts),
      top: Math.min(...tops),
      width: Math.max(...rights) - Math.min(...lefts),
      height: Math.max(...bottoms) - Math.min(...tops),
    }
  }
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Alignment</h3>
      
      {/* Horizontal Alignment */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Horizontal</Label>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={alignLeft}
            className="flex-1"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={alignCenter}
            className="flex-1"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={alignRight}
            className="flex-1"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Vertical Alignment */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Vertical</Label>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={alignTop}
            className="flex-1"
            title="Align Top"
          >
            <AlignTop className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={alignMiddle}
            className="flex-1"
            title="Align Middle"
          >
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={alignBottom}
            className="flex-1"
            title="Align Bottom"
          >
            <AlignBottom className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Distribution */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Distribute</Label>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={distributeHorizontally}
            className="flex-1"
            title="Distribute Horizontally"
          >
            <MoveHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={distributeVertically}
            className="flex-1"
            title="Distribute Vertically"
          >
            <MoveVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Align to Canvas */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Align to Canvas</Label>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alignToCanvas('left')}
            className="text-xs"
            title="Align to Left Edge"
          >
            Left
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alignToCanvas('center')}
            className="text-xs"
            title="Align to Center"
          >
            Center
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alignToCanvas('right')}
            className="text-xs"
            title="Align to Right Edge"
          >
            Right
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alignToCanvas('top')}
            className="text-xs"
            title="Align to Top Edge"
          >
            Top
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alignToCanvas('middle')}
            className="text-xs"
            title="Align to Middle"
          >
            Middle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alignToCanvas('bottom')}
            className="text-xs"
            title="Align to Bottom Edge"
          >
            Bottom
          </Button>
        </div>
      </div>
    </div>
  )
}

