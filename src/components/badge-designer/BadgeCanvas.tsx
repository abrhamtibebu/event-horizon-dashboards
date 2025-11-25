import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as fabric from 'fabric'
import { useBadgeStore, useElement } from '@/lib/badge-designer/store/useBadgeStore'
import { generateQRCode } from '@/lib/badge-designer/utils/qrWorkerManager'
import { objectPool } from '@/lib/badge-designer/utils/objectPool'
import { cn } from '@/lib/utils'
import {
  renderTextElement,
  renderQRElement,
  renderImageElement,
  renderShapeElement,
  renderLineElement,
  renderPolygonElement,
  renderTableElement,
  renderGroupElement,
} from '@/lib/badge-designer/utils/elementRenderers'

// Sample data for preview
const SAMPLE_DATA = {
  attendee: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Acme Corp',
    jobtitle: 'Product Manager',
    phone: '+1234567890',
    uuid: 'ATT-2024-001-ABC123',
  },
  event: {
    name: 'Tech Conference 2024',
    date: '2024-12-15',
    location: 'Convention Center',
  },
  guest_type: {
    name: 'VIP',
  },
}

// Render batching
let renderQueue: (() => void)[] = []
let rafScheduled = false

function scheduleRender(callback: () => void) {
  renderQueue.push(callback)
  if (!rafScheduled) {
    rafScheduled = true
    requestAnimationFrame(() => {
      renderQueue.forEach(cb => cb())
      renderQueue = []
      rafScheduled = false
    })
  }
}

export function BadgeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const rafThrottle = useRef<number | null>(null)
  const renderTimeout = useRef<NodeJS.Timeout | null>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [isRendering, setIsRendering] = useState(false)
  
  const { 
    elements, 
    updateElement, 
    setActiveElement, 
    setSelectedElements,
    canvasSize, 
    currentSide, 
    backgroundImage,
    selectedElementIds,
  } = useBadgeStore()
  
  // Memoize element IDs to prevent unnecessary re-renders
  const elementIds = useMemo(() => elements.map(el => el.id), [elements.length])
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: true,
      renderOnAddRemove: false, // Manual rendering for better performance
      stateful: true,
    })
    
    // Enable object caching for better performance
    fabric.Object.prototype.objectCaching = true
    fabric.Object.prototype.statefullCache = true
    
    // Throttle object movement with RAF for better performance
    canvas.on('object:moving', (e) => {
      if (rafThrottle.current) return
      
      rafThrottle.current = requestAnimationFrame(() => {
        const obj = e.target
        if (obj) {
          // Snap to grid (10px intervals)
          obj.set({
            left: Math.round((obj.left || 0) / 10) * 10,
            top: Math.round((obj.top || 0) / 10) * 10,
          })
          canvas.renderAll()
        }
        rafThrottle.current = null
      })
    })
    
    // Batch selection updates
    canvas.on('selection:created', (e) => {
      const selected = e.selected || []
      const ids = selected
        .map(obj => (obj as any).data?.id)
        .filter(Boolean) as string[]
      setSelectedElements(ids)
      if (ids.length === 1) {
        setActiveElement(ids[0])
      }
    })
    
    canvas.on('selection:updated', (e) => {
      const selected = e.selected || []
      const ids = selected
        .map(obj => (obj as any).data?.id)
        .filter(Boolean) as string[]
      setSelectedElements(ids)
      if (ids.length === 1) {
        setActiveElement(ids[0])
      }
    })
    
    canvas.on('selection:cleared', () => {
      setActiveElement(null)
      setSelectedElements([])
    })
    
    // Debounce object modifications
    let modifyTimeout: NodeJS.Timeout | null = null
    canvas.on('object:modified', (e) => {
      if (modifyTimeout) clearTimeout(modifyTimeout)
      
      modifyTimeout = setTimeout(() => {
        const obj = e.target
        if (obj && (obj as any).data?.id) {
          const updates: any = {
            left: obj.left,
            top: obj.top,
            angle: obj.angle,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
          }
          
          // For Textbox elements, also capture width changes
          if (obj.type === 'textbox' && (obj as any).width) {
            updates.width = (obj as any).width
          }
          
          updateElement((obj as any).data.id, updates, false)
        }
      }, 100) // 100ms debounce
    })
    
    fabricRef.current = canvas
    
    return () => {
      if (modifyTimeout) clearTimeout(modifyTimeout)
      canvas.dispose()
      if (rafThrottle.current) {
        cancelAnimationFrame(rafThrottle.current)
      }
      objectPool.clear()
    }
  }, [canvasSize])
  
  // Responsive scaling
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.clientWidth
      const baseWidth = canvasSize.width
      
      // Scale down on smaller screens
      if (containerWidth < 500) {
        setCanvasScale(containerWidth / baseWidth * 0.8)
      } else if (containerWidth < 800) {
        setCanvasScale(0.9)
      } else {
        setCanvasScale(1)
      }
    }
    
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [canvasSize])
  
  // Optimized element rendering with lazy loading
  const renderElement = useCallback(async (element: any, canvas: fabric.Canvas, allElements?: any[]) => {
    let fabricObject: fabric.Object | null = null
    
    try {
      switch (element.type) {
        case 'text':
          fabricObject = await renderTextElement(element, SAMPLE_DATA)
          break
        case 'qr':
          fabricObject = await renderQRElement(element, SAMPLE_DATA)
          break
        case 'image':
          fabricObject = await renderImageElement(element)
          break
        case 'shape':
          fabricObject = renderShapeElement(element)
          break
        case 'line':
          fabricObject = renderLineElement(element)
          break
        case 'polygon':
          fabricObject = renderPolygonElement(element)
          break
        case 'table':
          fabricObject = await renderTableElement(element, SAMPLE_DATA)
          break
        case 'group':
          fabricObject = await renderGroupElement(element, allElements || elements, SAMPLE_DATA)
          break
        default:
          console.warn('Unknown element type:', element.type)
      }
      
      if (fabricObject) {
        (fabricObject as any).data = { id: element.id }
        return fabricObject
      }
    } catch (error) {
      console.error('Error rendering element:', error, element)
    }
    
    return null
  }, [elements])
  
  // Sync elements from store to canvas with optimized rendering
  useEffect(() => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    
    // Debounce rapid updates
    if (renderTimeout.current) {
      clearTimeout(renderTimeout.current)
    }
    
    setIsRendering(true)
    renderTimeout.current = setTimeout(async () => {
      const startTime = performance.now()
      
      // Clear canvas but preserve background
      const existingObjects = canvas.getObjects()
      existingObjects.forEach(obj => {
        const elementId = (obj as any).data?.id
        if (elementId && !elements.find(el => el.id === elementId)) {
          canvas.remove(obj)
        }
      })
      
      canvas.backgroundColor = '#ffffff'
      
      // Load background image if exists
      const currentBackground = backgroundImage[currentSide]
      if (currentBackground) {
        try {
          await new Promise<void>((resolve, reject) => {
            const imgElement = new Image()
            imgElement.crossOrigin = 'anonymous'
            
            imgElement.onload = () => {
              const fabricImg = new fabric.Image(imgElement)
              const scaleX = canvasSize.width / (fabricImg.width || canvasSize.width)
              const scaleY = canvasSize.height / (fabricImg.height || canvasSize.height)
              const scale = Math.max(scaleX, scaleY)
              
              fabricImg.set({
                left: 0,
                top: 0,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
                opacity: 0.7,
                objectCaching: true,
              })
              
              canvas.backgroundImage = fabricImg
              canvas.renderAll()
              resolve()
            }
            
            imgElement.onerror = reject
            imgElement.src = currentBackground
          })
        } catch (error) {
          console.error('Error loading background image:', error)
          canvas.backgroundImage = null
        }
      } else {
        canvas.backgroundImage = null
      }
      
      // Render elements in batches for better performance
      const batchSize = 10
      const existingIds = new Set(
        canvas.getObjects().map(obj => (obj as any).data?.id).filter(Boolean)
      )
      
      for (let i = 0; i < elements.length; i += batchSize) {
        const batch = elements.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map(async (element) => {
            // Skip if already rendered
            if (existingIds.has(element.id)) {
              const existingObj = canvas.getObjects().find(
                obj => (obj as any).data?.id === element.id
              )
              if (existingObj) {
                // Update existing object instead of recreating
                existingObj.set({
                  left: element.properties.left || 0,
                  top: element.properties.top || 0,
                  angle: element.properties.angle || 0,
                  scaleX: element.properties.scaleX || 1,
                  scaleY: element.properties.scaleY || 1,
                })
                return
              }
            }
            
            const fabricObject = await renderElement(element, canvas, elements)
            if (fabricObject) {
              canvas.add(fabricObject)
            }
          })
        )
        
        // Render after each batch
        canvas.renderAll()
        
        // Yield to browser
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      canvas.renderAll()
      setIsRendering(false)
      
      const renderTime = performance.now() - startTime
      useBadgeStore.getState().updatePerformanceMetrics({ renderTime })
    }, 50) // 50ms debounce
    
    return () => {
      if (renderTimeout.current) {
        clearTimeout(renderTimeout.current)
      }
    }
  }, [elements, currentSide, backgroundImage, canvasSize, renderElement])
  
  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full overflow-auto flex items-center justify-center"
    >
      {isRendering && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Rendering...</div>
        </div>
      )}
      <div
        className={cn(
          "relative border-2 border-gray-200 rounded-lg shadow-sm bg-white"
        )}
        style={{ 
          transform: `scale(${canvasScale})`,
          transformOrigin: 'center',
        }}
      >
        <canvas ref={canvasRef} />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none grid-pattern opacity-30" />
      </div>
    </div>
  )
}
