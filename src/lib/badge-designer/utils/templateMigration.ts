import type { BadgeElement } from '@/types/badge-designer/badge'

// Convert Konva templates to Fabric.js format
export function convertKonvaToFabric(konvaTemplate: any): BadgeElement[] {
  if (!konvaTemplate || !konvaTemplate.elements) {
    return []
  }
  
  return konvaTemplate.elements.map((el: any) => {
    const baseElement: BadgeElement = {
      id: el.id || crypto.randomUUID(),
      type: el.type || 'text',
      properties: {
        left: el.x || 0,
        top: el.y || 0,
        angle: el.rotation || 0,
      },
    }
    
    if (el.type === 'text') {
      return {
        ...baseElement,
        properties: {
          ...baseElement.properties,
          content: el.text || '',
          fontSize: el.fontSize || 24,
          fontFamily: el.fontFamily || 'Arial',
          fill: el.fill || '#000000',
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
        },
      }
    }
    
    if (el.type === 'qr') {
      return {
        ...baseElement,
        properties: {
          ...baseElement.properties,
          qrData: el.data || '',
          size: el.size || 150,
        },
      }
    }
    
    if (el.type === 'image') {
      return {
        ...baseElement,
        properties: {
          ...baseElement.properties,
          src: el.src || '',
          width: el.width,
          height: el.height,
        },
      }
    }
    
    // Default for other types
    return baseElement
  })
}

// Migrate from version 1.0 (Konva) to version 2.0 (Fabric.js)
export function migrateV1ToV2(template: any) {
  return {
    version: '2.0',
    objects: convertKonvaToFabric(template),
    metadata: {
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionHistory: ['1.0', '2.0'],
    },
  }
}

// Migrate from version 2.0 to 2.1 (add new properties)
export function migrateV2ToV2_1(template: any) {
  return {
    ...template,
    version: '2.1',
    objects: template.objects.map((obj: any) => ({
      ...obj,
      // Add any new default properties introduced in v2.1
      opacity: obj.opacity ?? 1,
      shadow: obj.shadow ?? null,
    })),
    metadata: {
      ...template.metadata,
      updatedAt: new Date().toISOString(),
      versionHistory: [...(template.metadata?.versionHistory || []), '2.1'],
    },
  }
}

// Auto-migrate template to latest version
export function migrateTemplate(template: any) {
  let migrated = template
  
  // Detect version
  const version = template.version || '1.0'
  
  if (version === '1.0') {
    migrated = migrateV1ToV2(migrated)
  }
  
  if (migrated.version === '2.0') {
    migrated = migrateV2ToV2_1(migrated)
  }
  
  return migrated
}


