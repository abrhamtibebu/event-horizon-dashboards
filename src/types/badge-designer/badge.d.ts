import * as fabric from 'fabric'

export interface BadgeElement {
  id: string
  type: 'text' | 'qr' | 'image' | 'shape' | 'line' | 'polygon' | 'group' | 'table'
  fabricObject?: fabric.Object
  groupId?: string // For grouped elements
  properties: {
    // Common properties
    left?: number
    top?: number
    width?: number
    height?: number
    angle?: number
    scaleX?: number
    scaleY?: number
    opacity?: number
    zIndex?: number
    
    // Text properties
    content?: string
    dynamicField?: string // e.g. "{attendee.name}"
    fontSize?: number
    fontFamily?: string
    fill?: string
    fontWeight?: string | number
    fontStyle?: string
    textAlign?: string
    lineHeight?: number
    letterSpacing?: number
    textDecoration?: string
    textShadow?: {
      offsetX?: number
      offsetY?: number
      blur?: number
      color?: string
    }
    
    // QR Code properties
    qrData?: string
    size?: number
    qrColor?: {
      dark?: string
      light?: string
    }
    qrStyle?: 'square' | 'dots' | 'rounded'
    qrLogo?: string
    
    // Image properties
    src?: string
    imageFilters?: string[]
    
    // Shape properties
    shapeType?: 'rectangle' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'star' | 'heart'
    stroke?: string
    strokeWidth?: number
    strokeDashArray?: number[]
    rx?: number // Border radius for rectangles
    ry?: number
    
    // Line properties
    lineType?: 'straight' | 'arrow' | 'curved'
    startX?: number
    startY?: number
    endX?: number
    endY?: number
    arrowHead?: boolean
    arrowTail?: boolean
    
    // Polygon properties
    sides?: number
    radius?: number
    
    // Table properties
    rows?: number
    columns?: number
    cells?: Array<{
      row: number
      col: number
      content?: string
      backgroundColor?: string
      borderColor?: string
      textAlign?: string
    }>
    
    // Group properties
    children?: string[] // Element IDs in group
  }
}

export interface BadgeTemplate {
  id?: number
  name: string
  version: string
  objects: any[]
  metadata: {
    createdAt: string
    updatedAt: string
    versionHistory: string[]
  }
}

export interface SampleData {
  attendee: {
    name: string
    email: string
    company?: string
    jobtitle?: string
    uuid: string
    phone?: string
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


