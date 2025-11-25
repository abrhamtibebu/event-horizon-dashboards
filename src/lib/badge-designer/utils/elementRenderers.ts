/**
 * Element renderers for different badge element types
 */
import * as fabric from 'fabric'
import type { BadgeElement, SampleData } from '@/types/badge-designer/badge'
import { replaceDynamicFields } from './dynamicFields'
import { generateQRCode } from './qrWorkerManager'

export async function renderTextElement(
  element: BadgeElement,
  sampleData?: SampleData
): Promise<fabric.Textbox> {
  let content = element.properties.content || 'Double-click to edit'
  
  // Replace dynamic fields if sample data provided
  if (sampleData) {
    content = replaceDynamicFields(content, sampleData)
  }
  
  const textbox = new fabric.Textbox(content, {
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
    opacity: element.properties.opacity ?? 1,
    lineHeight: element.properties.lineHeight,
    charSpacing: element.properties.letterSpacing,
    lockScalingFlip: false,
    hasControls: true,
    hasBorders: true,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: '#2563eb',
    cornerStrokeColor: '#1e40af',
    borderColor: '#2563eb',
    lockScalingY: false,
    splitByGrapheme: true,
    objectCaching: true,
    statefullCache: true,
  })
  
  // Apply text shadow if specified
  if (element.properties.textShadow) {
    const shadow = element.properties.textShadow
    textbox.set('shadow', new fabric.Shadow({
      offsetX: shadow.offsetX || 0,
      offsetY: shadow.offsetY || 0,
      blur: shadow.blur || 0,
      color: shadow.color || '#000000',
    }))
  }
  
  return textbox
}

export async function renderQRElement(
  element: BadgeElement,
  sampleData?: SampleData
): Promise<fabric.Image | null> {
  try {
    let rawQrData = element.properties.qrData || element.properties.dynamicField || 'https://validity.et'
    
    // Replace dynamic fields if sample data provided
    if (sampleData) {
      rawQrData = replaceDynamicFields(rawQrData, sampleData)
    }
    
    const qrSize = element.properties.size || 150
    const qrUrl = await generateQRCode(rawQrData, qrSize)
    
    return new Promise<fabric.Image>((resolve, reject) => {
      const imgElement = new Image()
      imgElement.onload = () => {
        const fabricImg = new fabric.Image(imgElement)
        fabricImg.set({
          left: element.properties.left || 50,
          top: element.properties.top || 50,
          scaleX: element.properties.scaleX || 1,
          scaleY: element.properties.scaleY || 1,
          angle: element.properties.angle || 0,
          opacity: element.properties.opacity ?? 1,
          lockScalingFlip: false,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#2563eb',
          cornerStrokeColor: '#1e40af',
          borderColor: '#2563eb',
          objectCaching: true,
          statefullCache: true,
        })
        resolve(fabricImg)
      }
      imgElement.onerror = reject
      imgElement.src = qrUrl
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return null
  }
}

export async function renderImageElement(
  element: BadgeElement
): Promise<fabric.Image | null> {
  if (!element.properties.src) return null
  
  return new Promise<fabric.Image>((resolve, reject) => {
    fabric.Image.fromURL(
      element.properties.src!,
      (img) => {
        if (!img) {
          reject(new Error('Failed to load image'))
          return
        }
        img.set({
          left: element.properties.left || 50,
          top: element.properties.top || 50,
          scaleX: element.properties.scaleX || 1,
          scaleY: element.properties.scaleY || 1,
          angle: element.properties.angle || 0,
          opacity: element.properties.opacity ?? 1,
          lockScalingFlip: false,
          hasControls: true,
          hasBorders: true,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#2563eb',
          cornerStrokeColor: '#1e40af',
          borderColor: '#2563eb',
          objectCaching: true,
          statefullCache: true,
        })
        resolve(img)
      },
      { crossOrigin: 'anonymous' }
    )
  })
}

export function renderShapeElement(element: BadgeElement): fabric.Object | null {
  const shapeType = element.properties.shapeType || 'rectangle'
  
  if (shapeType === 'rectangle') {
    return new fabric.Rect({
      left: element.properties.left || 50,
      top: element.properties.top || 50,
      width: element.properties.width || 100,
      height: element.properties.height || 100,
      fill: element.properties.fill || '#cccccc',
      stroke: element.properties.stroke,
      strokeWidth: element.properties.strokeWidth || 0,
      strokeDashArray: element.properties.strokeDashArray,
      rx: element.properties.rx || 0,
      ry: element.properties.ry || 0,
      scaleX: element.properties.scaleX || 1,
      scaleY: element.properties.scaleY || 1,
      angle: element.properties.angle || 0,
      opacity: element.properties.opacity ?? 1,
      lockScalingFlip: false,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerStrokeColor: '#1e40af',
      borderColor: '#2563eb',
      objectCaching: true,
      statefullCache: true,
    })
  } else if (shapeType === 'circle') {
    return new fabric.Circle({
      left: element.properties.left || 50,
      top: element.properties.top || 50,
      radius: (element.properties.width || 100) / 2,
      fill: element.properties.fill || '#cccccc',
      stroke: element.properties.stroke,
      strokeWidth: element.properties.strokeWidth || 0,
      strokeDashArray: element.properties.strokeDashArray,
      scaleX: element.properties.scaleX || 1,
      scaleY: element.properties.scaleY || 1,
      angle: element.properties.angle || 0,
      opacity: element.properties.opacity ?? 1,
      lockScalingFlip: false,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerStrokeColor: '#1e40af',
      borderColor: '#2563eb',
      objectCaching: true,
      statefullCache: true,
    })
  } else if (shapeType === 'ellipse') {
    return new fabric.Ellipse({
      left: element.properties.left || 50,
      top: element.properties.top || 50,
      rx: (element.properties.width || 100) / 2,
      ry: (element.properties.height || 100) / 2,
      fill: element.properties.fill || '#cccccc',
      stroke: element.properties.stroke,
      strokeWidth: element.properties.strokeWidth || 0,
      strokeDashArray: element.properties.strokeDashArray,
      scaleX: element.properties.scaleX || 1,
      scaleY: element.properties.scaleY || 1,
      angle: element.properties.angle || 0,
      opacity: element.properties.opacity ?? 1,
      lockScalingFlip: false,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerStrokeColor: '#1e40af',
      borderColor: '#2563eb',
      objectCaching: true,
      statefullCache: true,
    })
  }
  
  return null
}

export function renderLineElement(element: BadgeElement): fabric.Object | null {
  const lineType = element.properties.lineType || 'straight'
  const startX = element.properties.startX ?? element.properties.left ?? 50
  const startY = element.properties.startY ?? element.properties.top ?? 50
  const endX = element.properties.endX ?? (startX + (element.properties.width || 100))
  const endY = element.properties.endY ?? (startY + (element.properties.height || 0))
  
  if (lineType === 'straight' || lineType === 'arrow') {
    const line = new fabric.Line([startX, startY, endX, endY], {
      stroke: element.properties.stroke || element.properties.fill || '#000000',
      strokeWidth: element.properties.strokeWidth || 2,
      strokeDashArray: element.properties.strokeDashArray,
      opacity: element.properties.opacity ?? 1,
      lockScalingFlip: false,
      hasControls: true,
      hasBorders: true,
      cornerSize: 10,
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerStrokeColor: '#1e40af',
      borderColor: '#2563eb',
      objectCaching: true,
      statefullCache: true,
    })
    
    // Add arrowhead if needed
    if (lineType === 'arrow' && element.properties.arrowHead) {
      // Arrowhead would need custom rendering - simplified for now
      line.set('strokeLineCap', 'round')
    }
    
    return line
  }
  
  return null
}

export function renderPolygonElement(element: BadgeElement): fabric.Polygon | null {
  const sides = element.properties.sides || 5
  const radius = element.properties.radius || 50
  const centerX = (element.properties.left || 50) + radius
  const centerY = (element.properties.top || 50) + radius
  
  // Calculate polygon points
  const points: fabric.Point[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 // Start from top
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    points.push(new fabric.Point(x, y))
  }
  
  return new fabric.Polygon(points, {
    fill: element.properties.fill || '#cccccc',
    stroke: element.properties.stroke,
    strokeWidth: element.properties.strokeWidth || 0,
    strokeDashArray: element.properties.strokeDashArray,
    scaleX: element.properties.scaleX || 1,
    scaleY: element.properties.scaleY || 1,
    angle: element.properties.angle || 0,
    opacity: element.properties.opacity ?? 1,
    lockScalingFlip: false,
    hasControls: true,
    hasBorders: true,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: '#2563eb',
    cornerStrokeColor: '#1e40af',
    borderColor: '#2563eb',
    objectCaching: true,
    statefullCache: true,
  })
}

export async function renderTableElement(
  element: BadgeElement,
  sampleData?: SampleData
): Promise<fabric.Group | null> {
  const rows = element.properties.rows || 2
  const columns = element.properties.columns || 2
  const cellWidth = (element.properties.width || 200) / columns
  const cellHeight = (element.properties.height || 100) / rows
  const startX = element.properties.left || 50
  const startY = element.properties.top || 50
  
  const cells: fabric.Object[] = []
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = element.properties.cells?.find(
        c => c.row === row && c.col === col
      )
      
      const cellX = startX + col * cellWidth
      const cellY = startY + row * cellHeight
      
      // Cell background
      const rect = new fabric.Rect({
        left: cellX,
        top: cellY,
        width: cellWidth,
        height: cellHeight,
        fill: cell?.backgroundColor || '#ffffff',
        stroke: cell?.borderColor || '#cccccc',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      })
      cells.push(rect)
      
      // Cell text
      if (cell?.content) {
        let content = cell.content
        if (sampleData) {
          content = replaceDynamicFields(content, sampleData)
        }
        
        const text = new fabric.Text(content, {
          left: cellX + cellWidth / 2,
          top: cellY + cellHeight / 2,
          originX: 'center',
          originY: 'center',
          fontSize: 12,
          fill: '#000000',
          textAlign: cell.textAlign || 'center',
          selectable: false,
          evented: false,
        })
        cells.push(text)
      }
    }
  }
  
  if (cells.length === 0) return null
  
  const group = new fabric.Group(cells, {
    left: startX,
    top: startY,
    scaleX: element.properties.scaleX || 1,
    scaleY: element.properties.scaleY || 1,
    angle: element.properties.angle || 0,
    opacity: element.properties.opacity ?? 1,
    lockScalingFlip: false,
    hasControls: true,
    hasBorders: true,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: '#2563eb',
    cornerStrokeColor: '#1e40af',
    borderColor: '#2563eb',
    objectCaching: true,
    statefullCache: true,
  })
  
  return group
}

export async function renderGroupElement(
  element: BadgeElement,
  allElements: BadgeElement[],
  sampleData?: SampleData
): Promise<fabric.Group | null> {
  if (!element.properties.children || element.properties.children.length === 0) {
    return null
  }
  
  const childElements = allElements.filter(el => 
    element.properties.children?.includes(el.id)
  )
  
  if (childElements.length === 0) return null
  
  // Render child elements
  const childObjects: fabric.Object[] = []
  
  for (const childEl of childElements) {
    let obj: fabric.Object | null = null
    
    switch (childEl.type) {
      case 'text':
        obj = await renderTextElement(childEl, sampleData)
        break
      case 'qr':
        obj = await renderQRElement(childEl, sampleData)
        break
      case 'image':
        obj = await renderImageElement(childEl)
        break
      case 'shape':
        obj = renderShapeElement(childEl)
        break
      case 'line':
        obj = renderLineElement(childEl)
        break
      case 'polygon':
        obj = renderPolygonElement(childEl)
        break
    }
    
    if (obj) {
      childObjects.push(obj)
    }
  }
  
  if (childObjects.length === 0) return null
  
  const group = new fabric.Group(childObjects, {
    left: element.properties.left || 50,
    top: element.properties.top || 50,
    scaleX: element.properties.scaleX || 1,
    scaleY: element.properties.scaleY || 1,
    angle: element.properties.angle || 0,
    opacity: element.properties.opacity ?? 1,
    lockScalingFlip: false,
    hasControls: true,
    hasBorders: true,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: '#2563eb',
    cornerStrokeColor: '#1e40af',
    borderColor: '#2563eb',
    objectCaching: true,
    statefullCache: true,
  })
  
  return group
}





