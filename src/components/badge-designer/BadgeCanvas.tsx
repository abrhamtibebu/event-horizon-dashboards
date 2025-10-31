import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'

export function BadgeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const rafThrottle = useRef<number | null>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  
  const { elements, updateElement, setActiveElement, canvasSize, currentSide, backgroundImage } = useBadgeStore()
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: true,
    })
    
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
    
    // Sync selection to Zustand store
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0]
      if (obj && (obj as any).data?.id) {
        setActiveElement((obj as any).data.id)
      }
    })
    
    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0]
      if (obj && (obj as any).data?.id) {
        setActiveElement((obj as any).data.id)
      }
    })
    
    canvas.on('selection:cleared', () => {
      setActiveElement(null)
    })
    
    // Update element properties when modified
    canvas.on('object:modified', (e) => {
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
        
        updateElement((obj as any).data.id, {
          properties: updates,
        })
      }
    })
    
    fabricRef.current = canvas
    
    return () => {
      canvas.dispose()
      if (rafThrottle.current) {
        cancelAnimationFrame(rafThrottle.current)
      }
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
  
  // Sync elements from store to canvas
  useEffect(() => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    
    const renderCanvas = async () => {
      // Clear canvas but preserve background
      const objects = canvas.getObjects()
      objects.forEach(obj => canvas.remove(obj))
      canvas.backgroundColor = '#ffffff'
      
      // Load background image if exists
      const currentBackground = backgroundImage[currentSide]
      console.log('Rendering canvas - Background check:', {
        hasBackground: !!currentBackground,
        currentSide: currentSide,
        backgroundImage: backgroundImage
      })
      
      if (currentBackground) {
        try {
          await new Promise<void>((resolve, reject) => {
            console.log('Loading background from URL:', currentBackground.substring(0, 50) + '...')
            
            // Use native Image element for base64 data URLs (more reliable)
            const imgElement = new Image()
            imgElement.crossOrigin = 'anonymous'
            
            imgElement.onload = () => {
              console.log('Native image loaded, creating Fabric image...')
              
              // Create Fabric image from the loaded element
              const fabricImg = new fabric.Image(imgElement)
              
              // Calculate scale to cover the entire canvas
              const scaleX = canvasSize.width / (fabricImg.width || canvasSize.width)
              const scaleY = canvasSize.height / (fabricImg.height || canvasSize.height)
              const scale = Math.max(scaleX, scaleY)
              
              console.log('Background image loaded:', {
                imageSize: { width: fabricImg.width, height: fabricImg.height },
                canvasSize: { width: canvasSize.width, height: canvasSize.height },
                scaleX, scaleY, finalScale: scale
              })
              
              fabricImg.set({
                left: 0,
                top: 0,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
                opacity: 0.7, // Make it slightly transparent for editing
              })
              
              // Set as canvas background
              canvas.backgroundImage = fabricImg
              console.log('✅ Background image set successfully on canvas')
              canvas.renderAll()
              resolve()
            }
            
            imgElement.onerror = (error) => {
              console.error('❌ Failed to load background image:', error)
              reject(error)
            }
            
            // Start loading the image
            imgElement.src = currentBackground
          })
        } catch (error) {
          console.error('❌ Error loading background image:', error)
          // Continue rendering elements even if background fails
        }
      } else {
        console.log('No background image for current side:', currentSide)
        // Clear background if no image
        canvas.backgroundImage = null
        canvas.renderAll()
      }
      
      // Render each element (now synchronously after background is loaded)
      for (const element of elements) {
      let fabricObject: fabric.Object | null = null
      
      if (element.type === 'text') {
        // Use Textbox for resizable text with word wrapping
        fabricObject = new fabric.Textbox(element.properties.content || 'Double-click to edit', {
          left: element.properties.left || 50,
          top: element.properties.top || 50,
          width: element.properties.width || 200,
          fontSize: element.properties.fontSize || 24,
          fontFamily: element.properties.fontFamily || 'Arial',
          fill: element.properties.fill || '#000000',
          fontWeight: element.properties.fontWeight || 'normal',
          fontStyle: element.properties.fontStyle || 'normal',
          textAlign: element.properties.textAlign || 'left',
          scaleX: element.properties.scaleX || 1,
          scaleY: element.properties.scaleY || 1,
          angle: element.properties.angle || 0,
          // Enable resizing and rotation
          lockScalingFlip: false,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#2563eb',
          cornerStrokeColor: '#1e40af',
          borderColor: '#2563eb',
          // Enable edge dragging for width adjustment
          lockScalingY: false,
          splitByGrapheme: true, // Better text wrapping
        })
      } else if (element.type === 'qr') {
        try {
          // Replace dynamic fields with sample data for editor preview
          const sampleData = {
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
          
          const rawQrData = element.properties.qrData || element.properties.dynamicField || 'https://validity.et'
          // Replace dynamic field placeholders with sample data
          const qrData = rawQrData.replace(/\{(\w+)\.(\w+)\}/g, (match: string, entity: string, field: string) => {
            const value = (sampleData as any)[entity]?.[field]
            return value !== undefined ? String(value) : match
          })
          
          console.log('Generating QR code:', { raw: rawQrData, resolved: qrData })
          
          const qrSize = element.properties.size || 150
          const qrUrl = await QRCode.toDataURL(qrData, {
            width: qrSize,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          })
          
          fabricObject = await new Promise<fabric.Image>((resolve, reject) => {
            // Use native Image element for better reliability
            const imgElement = new Image()
            imgElement.onload = () => {
              const fabricImg = new fabric.Image(imgElement)
              fabricImg.set({
                left: element.properties.left || 50,
                top: element.properties.top || 50,
                scaleX: element.properties.scaleX || 1,
                scaleY: element.properties.scaleY || 1,
                angle: element.properties.angle || 0,
                // Enable resizing and rotation
                lockScalingFlip: false,
                hasControls: true,
                hasBorders: true,
                cornerSize: 10,
                transparentCorners: false,
                cornerColor: '#2563eb',
                cornerStrokeColor: '#1e40af',
                borderColor: '#2563eb',
              })
              resolve(fabricImg)
            }
            imgElement.onerror = reject
            imgElement.src = qrUrl
          })
        } catch (error) {
          console.error('Failed to generate QR code:', error)
        }
      } else if (element.type === 'image' && element.properties.src) {
        fabricObject = await new Promise<fabric.Image>((resolve) => {
          fabric.Image.fromURL(element.properties.src!, (img) => {
            img.set({
              left: element.properties.left || 50,
              top: element.properties.top || 50,
              scaleX: element.properties.scaleX || 1,
              scaleY: element.properties.scaleY || 1,
              angle: element.properties.angle || 0,
              // Enable resizing and rotation
              lockScalingFlip: false,
              hasControls: true,
              hasBorders: true,
              cornerSize: 10,
              transparentCorners: false,
              cornerColor: '#2563eb',
              cornerStrokeColor: '#1e40af',
              borderColor: '#2563eb',
            })
            resolve(img)
          })
        })
      } else if (element.type === 'shape') {
        if (element.properties.shapeType === 'rectangle') {
          fabricObject = new fabric.Rect({
            left: element.properties.left || 50,
            top: element.properties.top || 50,
            width: element.properties.width || 100,
            height: element.properties.height || 100,
            fill: element.properties.fill || '#cccccc',
            stroke: element.properties.stroke,
            strokeWidth: element.properties.strokeWidth || 0,
            scaleX: element.properties.scaleX || 1,
            scaleY: element.properties.scaleY || 1,
            angle: element.properties.angle || 0,
            // Enable resizing and rotation
            lockScalingFlip: false,
            hasControls: true,
            hasBorders: true,
            cornerSize: 10,
            transparentCorners: false,
            cornerColor: '#2563eb',
            cornerStrokeColor: '#1e40af',
            borderColor: '#2563eb',
          })
        } else if (element.properties.shapeType === 'circle') {
          fabricObject = new fabric.Circle({
            left: element.properties.left || 50,
            top: element.properties.top || 50,
            radius: (element.properties.width || 100) / 2,
            fill: element.properties.fill || '#cccccc',
            stroke: element.properties.stroke,
            strokeWidth: element.properties.strokeWidth || 0,
            scaleX: element.properties.scaleX || 1,
            scaleY: element.properties.scaleY || 1,
            angle: element.properties.angle || 0,
            // Enable resizing and rotation
            lockScalingFlip: false,
            hasControls: true,
            hasBorders: true,
            cornerSize: 10,
            transparentCorners: false,
            cornerColor: '#2563eb',
            cornerStrokeColor: '#1e40af',
            borderColor: '#2563eb',
          })
        }
      }
      
      if (fabricObject) {
        (fabricObject as any).data = { id: element.id }
        canvas.add(fabricObject)
      }
    }
    
    canvas.renderAll()
  }
  
  // Call the async render function
  renderCanvas()
  }, [elements, currentSide, backgroundImage, canvasSize])
  
  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full overflow-auto flex items-center justify-center"
    >
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


