import { useEffect, useRef } from 'react'
import * as fabric from 'fabric'
import QRCode from 'qrcode'
import { BadgeElement } from '@/types/badge-designer/badge'
import { replaceDynamicFields } from '@/lib/badge-designer/utils/dynamicFields'

interface BadgePreviewCanvasProps {
  elements: BadgeElement[]
  sampleData: {
    attendee: {
      name: string
      email: string
      company?: string
      jobtitle?: string
      phone?: string
      uuid: string
    }
    event: {
      name: string
      date: string
      location?: string
    }
    guest_type: {
      name: string
    }
  }
  width?: number
  height?: number
  backgroundImage?: string
}

export function BadgePreviewCanvas({ 
  elements, 
  sampleData, 
  width = 400, 
  height = 600,
  backgroundImage
}: BadgePreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: false, // Disable selection for preview
      renderOnAddRemove: true,
    })
    
    fabricRef.current = canvas
    
    // Render all elements
    const renderElements = async () => {
      canvas.clear()
      canvas.backgroundColor = '#ffffff'
      
      // Load background image if exists
      if (backgroundImage) {
        try {
          await new Promise<void>((resolve, reject) => {
            // Use native Image element for base64 data URLs (more reliable)
            const imgElement = new Image()
            imgElement.crossOrigin = 'anonymous'
            
            imgElement.onload = () => {
              // Create Fabric image from the loaded element
              const fabricImg = new fabric.Image(imgElement)
              
              // Calculate scale to cover the entire canvas while maintaining aspect ratio
              const scaleX = width / (fabricImg.width || width)
              const scaleY = height / (fabricImg.height || height)
              const scale = Math.max(scaleX, scaleY)
              
              fabricImg.set({
                left: 0,
                top: 0,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
                opacity: 1.0, // Full opacity for preview
              })
              
              // Set as canvas background
              canvas.backgroundImage = fabricImg
              console.log('Preview background image set successfully:', {
                originalSize: { width: fabricImg.width, height: fabricImg.height },
                scale: scale,
                canvasSize: { width, height }
              })
              canvas.renderAll()
              resolve()
            }
            
            imgElement.onerror = (error) => {
              console.error('Failed to create preview background image:', error)
              reject(error)
            }
            
            // Start loading the image
            imgElement.src = backgroundImage
          })
        } catch (error) {
          console.error('Failed to load background image:', error)
          // Continue rendering elements even if background fails
        }
      }
      
      for (const element of elements) {
        try {
          let obj: fabric.Object | null = null
          
          switch (element.type) {
            case 'text': {
              const content = replaceDynamicFields(
                element.properties.content || '',
                sampleData
              )
              
              obj = new fabric.Textbox(content, {
                left: element.properties.left || 0,
                top: element.properties.top || 0,
                width: element.properties.width || 200,
                fontSize: element.properties.fontSize || 16,
                fontFamily: element.properties.fontFamily || 'Arial',
                fontWeight: element.properties.fontWeight || 'normal',
                fontStyle: element.properties.fontStyle || 'normal',
                fill: element.properties.fill || '#000000',
                textAlign: element.properties.textAlign || 'left',
                angle: element.properties.angle || 0,
                scaleX: element.properties.scaleX || 1,
                scaleY: element.properties.scaleY || 1,
                selectable: false,
                evented: false,
              })
              break
            }
            
            case 'image': {
              if (element.properties.src) {
                await new Promise<void>((resolve, reject) => {
                  fabric.Image.fromURL(
                    element.properties.src!,
                    (img) => {
                      if (img) {
                        img.set({
                          left: element.properties.left || 0,
                          top: element.properties.top || 0,
                          scaleX: element.properties.scaleX || 1,
                          scaleY: element.properties.scaleY || 1,
                          angle: element.properties.angle || 0,
                          selectable: false,
                          evented: false,
                        })
                        
                        // Apply width/height if specified
                        if (element.properties.width) {
                          img.scaleToWidth(element.properties.width)
                        }
                        if (element.properties.height) {
                          img.scaleToHeight(element.properties.height)
                        }
                        
                        canvas.add(img)
                        resolve()
                      } else {
                        reject(new Error('Failed to load image'))
                      }
                    },
                    { crossOrigin: 'anonymous' }
                  )
                })
              }
              break
            }
            
            case 'shape': {
              const shapeType = element.properties.shapeType || 'rectangle'
              
              if (shapeType === 'rectangle') {
                obj = new fabric.Rect({
                  left: element.properties.left || 0,
                  top: element.properties.top || 0,
                  width: element.properties.width || 100,
                  height: element.properties.height || 100,
                  fill: element.properties.fill || '#000000',
                  stroke: element.properties.stroke,
                  strokeWidth: element.properties.strokeWidth || 0,
                  angle: element.properties.angle || 0,
                  scaleX: element.properties.scaleX || 1,
                  scaleY: element.properties.scaleY || 1,
                  rx: element.properties.rx || 0,
                  ry: element.properties.ry || 0,
                  selectable: false,
                  evented: false,
                })
              } else if (shapeType === 'circle') {
                obj = new fabric.Circle({
                  left: element.properties.left || 0,
                  top: element.properties.top || 0,
                  radius: element.properties.radius || 50,
                  fill: element.properties.fill || '#000000',
                  stroke: element.properties.stroke,
                  strokeWidth: element.properties.strokeWidth || 0,
                  angle: element.properties.angle || 0,
                  scaleX: element.properties.scaleX || 1,
                  scaleY: element.properties.scaleY || 1,
                  selectable: false,
                  evented: false,
                })
              } else if (shapeType === 'line') {
                const points = element.properties.points || [0, 0, 100, 100]
                obj = new fabric.Line(points, {
                  left: element.properties.left || 0,
                  top: element.properties.top || 0,
                  stroke: element.properties.stroke || '#000000',
                  strokeWidth: element.properties.strokeWidth || 2,
                  angle: element.properties.angle || 0,
                  scaleX: element.properties.scaleX || 1,
                  scaleY: element.properties.scaleY || 1,
                  selectable: false,
                  evented: false,
                })
              }
              break
            }
            
            case 'qr': {
              const qrData = replaceDynamicFields(
                element.properties.qrData || sampleData.attendee.uuid,
                sampleData
              )
              
              try {
                const qrSize = element.properties.size || element.properties.width || 150
                const qrDataUrl = await QRCode.toDataURL(qrData, {
                  width: qrSize,
                  margin: 1,
                  color: {
                    dark: '#000000',
                    light: '#ffffff',
                  },
                })
                
                await new Promise<void>((resolve, reject) => {
                  // Use native Image element for better reliability
                  const imgElement = new Image()
                  imgElement.onload = () => {
                    const fabricImg = new fabric.Image(imgElement)
                    // Scale the QR code image to the specified size
                    const targetSize = qrSize
                    const scale = targetSize / (fabricImg.width || targetSize)
                    
                    fabricImg.set({
                      left: element.properties.left || 0,
                      top: element.properties.top || 0,
                      scaleX: (element.properties.scaleX || 1) * scale,
                      scaleY: (element.properties.scaleY || 1) * scale,
                      angle: element.properties.angle || 0,
                      selectable: false,
                      evented: false,
                    })
                    
                    canvas.add(fabricImg)
                    resolve()
                  }
                  imgElement.onerror = reject
                  imgElement.src = qrDataUrl
                })
              } catch (error) {
                console.error('Failed to generate QR code:', error)
              }
              break
            }
          }
          
          if (obj) {
            canvas.add(obj)
          }
        } catch (error) {
          console.error('Failed to render element:', error, element)
        }
      }
      
      canvas.renderAll()
    }
    
    renderElements()
    
    return () => {
      canvas.dispose()
    }
  }, [elements, sampleData, width, height, backgroundImage])
  
  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} />
    </div>
  )
}

