import * as fabric from 'fabric'

export interface BadgeElement {
  id: string
  type: 'text' | 'qr' | 'image' | 'shape'
  fabricObject?: fabric.Object
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
    
    // Text properties
    content?: string
    dynamicField?: string // e.g. "{attendee.name}"
    fontSize?: number
    fontFamily?: string
    fill?: string
    fontWeight?: string | number
    fontStyle?: string
    textAlign?: string
    
    // QR Code properties
    qrData?: string
    size?: number
    
    // Image properties
    src?: string
    
    // Shape properties
    shapeType?: 'rectangle' | 'circle' | 'line'
    stroke?: string
    strokeWidth?: number
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


