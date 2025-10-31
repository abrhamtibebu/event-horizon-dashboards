import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { cn } from '@/lib/utils'
import { BadgeConfiguration } from './BadgeConfiguration'

export function Sidebar() {
  const { elements, activeElementId, setActiveElement, deleteElement, reorderElements } = useBadgeStore()
  const [showConfig, setShowConfig] = useState(true)
  
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderElements(index, index - 1)
    }
  }
  
  const handleMoveDown = (index: number) => {
    if (index < elements.length - 1) {
      reorderElements(index, index + 1)
    }
  }
  
  const getElementLabel = (element: typeof elements[0]) => {
    switch (element.type) {
      case 'text':
        return element.properties.content?.substring(0, 20) || 'Text'
      case 'qr':
        return 'QR Code'
      case 'image':
        return 'Image'
      case 'shape':
        return element.properties.shapeType === 'rectangle' ? 'Rectangle' : 'Circle'
      default:
        return element.type
    }
  }
  
  return (
    <div className="w-full lg:w-80 flex flex-col h-full">
      {/* Badge Configuration Section */}
      <div className="p-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfig(!showConfig)}
          className="w-full justify-start px-2"
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", showConfig && "rotate-90")} />
          <span className="ml-2 font-semibold">Configuration</span>
        </Button>
      </div>
      {showConfig && (
        <div className="p-3 border-b max-h-[500px] overflow-auto">
          <BadgeConfiguration />
        </div>
      )}
      
      {/* Layers Section */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">Layers</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {elements.length} element{elements.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No elements yet. Add some from the toolbar!
          </div>
        ) : (
          <div className="p-2">
            {elements.map((el, index) => (
              <div
                key={el.id}
                className={cn(
                  "group relative p-3 mb-2 border rounded-lg cursor-pointer transition-all",
                  "hover:bg-gray-50 hover:border-gray-300",
                  activeElementId === el.id && "bg-blue-50 border-blue-300 shadow-sm"
                )}
                onClick={() => setActiveElement(el.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm capitalize truncate">
                      {getElementLabel(el)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {el.type}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <div className="flex flex-col">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveUp(index)
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveDown(index)
                        }}
                        disabled={index === elements.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Delete button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(el.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}


