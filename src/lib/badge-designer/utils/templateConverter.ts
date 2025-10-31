/**
 * Converts the new Badge Designer template format to the legacy format
 * used by the Badge component for printing
 */

import { BadgeTemplate } from '@/types/badge'
import { v4 as uuidv4 } from 'uuid'

interface NewTemplateElement {
  id: string
  type: 'text' | 'qr' | 'image' | 'shape'
  properties: {
    content?: string
    qrData?: string
    src?: string
    left?: number
    top?: number
    width?: number
    height?: number
    fontSize?: number
    fontFamily?: string
    fill?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
    shapeType?: string
    backgroundColor?: string
    scaleX?: number
    scaleY?: number
    angle?: number
  }
}

interface LegacyBadgeElement {
  id: string
  type: 'text' | 'qr' | 'image' | 'shape'
  content?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: string
  shapeType?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  src?: string
}

export function convertBadgeDesignerToLegacy(newTemplate: any): BadgeTemplate {
  if (!newTemplate || !newTemplate.template_json) {
    return createEmptyLegacyTemplate()
  }

  const templateJson = newTemplate.template_json
  
  // Check if it's already in legacy format
  if (templateJson.front && templateJson.back) {
    return newTemplate as BadgeTemplate
  }

  // Convert new format to legacy format
  const elements = templateJson.elements || []
  const canvasSize = templateJson.canvasSize || { width: 400, height: 600 }
  
  const legacyElements: LegacyBadgeElement[] = elements.map((el: NewTemplateElement, index: number) => {
    const baseElement = {
      id: el.id || uuidv4(),
      type: el.type,
      x: el.properties.left || 0,
      y: el.properties.top || 0,
      width: el.properties.width || 100,
      height: el.properties.height || (el.type === 'text' ? 30 : 100),
      rotation: el.properties.angle || 0,
      zIndex: index + 1,
    }

    switch (el.type) {
      case 'text':
        return {
          ...baseElement,
          content: convertDynamicFields(el.properties.content || ''),
          fontFamily: el.properties.fontFamily || 'Helvetica',
          fontSize: el.properties.fontSize || 16,
          fontWeight: el.properties.fontWeight || 'normal',
          color: el.properties.fill || '#000000',
          textAlign: el.properties.textAlign || 'left',
        }
      
      case 'qr':
        // QR codes in legacy format need special handling
        return {
          ...baseElement,
          type: 'text',
          content: 'QR: ' + convertDynamicFields(el.properties.qrData || '{uuid}'),
          fontFamily: 'Courier',
          fontSize: 10,
          color: '#000000',
          textAlign: 'center',
        }
      
      case 'image':
        return {
          ...baseElement,
          src: el.properties.src,
        }
      
      case 'shape':
        return {
          ...baseElement,
          shapeType: el.properties.shapeType || 'rectangle',
          backgroundColor: el.properties.fill || '#cccccc',
          borderColor: '#000000',
          borderWidth: 1,
        }
      
      default:
        return baseElement as LegacyBadgeElement
    }
  })

  return {
    id: newTemplate.id || 0,
    event_id: newTemplate.event_id || 0,
    name: newTemplate.name || 'Converted Template',
    template_json: {
      front: {
        elements: legacyElements,
        background: templateJson.backgroundImage?.front || null,
      },
      back: {
        elements: [],
        background: templateJson.backgroundImage?.back || null,
      },
    },
    status: newTemplate.status || 'official',
  }
}

/**
 * Convert dynamic field placeholders from new format to legacy format
 */
function convertDynamicFields(content: string): string {
  return content
    .replace(/{attendee\.name}/g, '{fullName}')
    .replace(/{attendee\.email}/g, '{email}')
    .replace(/{attendee\.company}/g, '{company}')
    .replace(/{attendee\.jobtitle}/g, '{jobTitle}')
    .replace(/{attendee\.phone}/g, '{phone}')
    .replace(/{attendee\.uuid}/g, '{uuid}')
    .replace(/{event\.name}/g, '{eventName}')
    .replace(/{event\.date}/g, '{eventDate}')
    .replace(/{event\.location}/g, '{eventLocation}')
    .replace(/{guest_type\.name}/g, '{guestType}')
}

function createEmptyLegacyTemplate(): BadgeTemplate {
  return {
    id: 0,
    event_id: 0,
    name: 'Empty Template',
    template_json: {
      front: {
        elements: [],
        background: null,
      },
      back: {
        elements: [],
        background: null,
      },
    },
    status: 'draft',
  }
}









