import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  ChevronRight,
  Layers,
  Settings,
  GripVertical,
  Copy,
  Lock,
  Unlock,
} from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { cn } from '@/lib/utils'
import { BadgeConfiguration } from './BadgeConfiguration'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function Sidebar() {
  const { elements, activeElementId, setActiveElement, deleteElement, reorderElements } = useBadgeStore()
  const [showConfig, setShowConfig] = useState(true)
  const [expandedLayers, setExpandedLayers] = useState(true)
  
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
  
  const getElementIcon = (element: typeof elements[0]) => {
    switch (element.type) {
      case 'text':
        return 'T'
      case 'qr':
        return 'QR'
      case 'image':
        return 'IMG'
      case 'shape':
        return '□'
      case 'line':
        return '—'
      case 'polygon':
        return '⬡'
      case 'table':
        return '⊞'
      case 'group':
        return '⊚'
      default:
        return '•'
    }
  }
  
  const getElementLabel = (element: typeof elements[0]) => {
    switch (element.type) {
      case 'text':
        return element.properties.content?.substring(0, 25) || 'Text Element'
      case 'qr':
        return 'QR Code'
      case 'image':
        return 'Image'
      case 'shape':
        return element.properties.shapeType === 'rectangle' ? 'Rectangle' : 
               element.properties.shapeType === 'circle' ? 'Circle' :
               element.properties.shapeType === 'ellipse' ? 'Ellipse' : 'Shape'
      case 'line':
        return 'Line'
      case 'polygon':
        return `Polygon (${element.properties.sides || 5} sides)`
      case 'table':
        return `Table (${element.properties.rows || 3}×${element.properties.columns || 3})`
      case 'group':
        return `Group (${element.properties.children?.length || 0} items)`
      default:
        return element.type.charAt(0).toUpperCase() + element.type.slice(1)
    }
  }
  
  const getElementColor = (element: typeof elements[0]) => {
    switch (element.type) {
      case 'text':
        return 'bg-blue-500'
      case 'qr':
        return 'bg-purple-500'
      case 'image':
        return 'bg-green-500'
      case 'shape':
        return 'bg-orange-500'
      case 'line':
        return 'bg-pink-500'
      case 'polygon':
        return 'bg-indigo-500'
      case 'table':
        return 'bg-teal-500'
      case 'group':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }
  
  return (
    <TooltipProvider>
      <div className="w-full flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Layers & Settings
          </h3>
        </div>
        
        {/* Configuration Section */}
        <div className="border-b">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Badge Settings</span>
            </div>
            <ChevronRight className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              showConfig && "rotate-90"
            )} />
          </button>
          
          {showConfig && (
            <div className="px-3 pb-3 border-t bg-gray-50/50">
              <BadgeConfiguration />
            </div>
          )}
        </div>
        
        {/* Layers Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-white">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setExpandedLayers(!expandedLayers)}
                className="flex items-center gap-2 hover:text-gray-900 transition-colors"
              >
                <Layers className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Layers</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {elements.length}
                </Badge>
              </button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {elements.length === 0 ? (
              <div className="p-6 text-center">
                <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">No elements yet</p>
                <p className="text-xs text-gray-400">Add elements from the toolbar</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {elements.map((el, index) => {
                  const isActive = activeElementId === el.id
                  
                  return (
                    <div
                      key={el.id}
                      className={cn(
                        "group relative p-2 rounded-lg cursor-pointer transition-all",
                        "border border-transparent",
                        isActive 
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" 
                          : "hover:bg-gray-50 hover:border-gray-200"
                      )}
                      onClick={() => setActiveElement(el.id)}
                    >
                      <div className="flex items-center gap-2">
                        {/* Drag Handle */}
                        <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move" />
                        
                        {/* Element Icon */}
                        <div className={cn(
                          "w-8 h-8 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0",
                          getElementColor(el)
                        )}>
                          {getElementIcon(el)}
                        </div>
                        
                        {/* Element Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {getElementLabel(el)}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {el.type}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Visibility Toggle */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Toggle visibility logic here
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle visibility</TooltipContent>
                          </Tooltip>
                          
                          {/* Delete */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteElement(el.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete element</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Reorder Controls */}
                      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveUp(index)
                              }}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move up</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveDown(index)
                              }}
                              disabled={index === elements.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move down</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  )
}
