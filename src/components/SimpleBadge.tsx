import React from 'react';
import QRCode from 'react-qr-code';
import { Attendee } from '@/types/attendee';

// BadgeElement type definition (legacy support)
export interface BadgeElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'shape';
  content?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  textAlign?: string;
  src?: string;
  rotation?: number;
}

interface SimpleBadgeProps {
  attendee: Attendee;
  template?: BadgeElement[];
}

// Default badge template if no custom template is provided
const DEFAULT_BADGE_TEMPLATE: BadgeElement[] = [
  {
    id: 'name-field',
    type: 'guestField',
    x: 50,
    y: 50,
    width: 300,
    height: 40,
    rotation: 0,
    zIndex: 1,
    visible: true,
    guestField: 'name',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center'
  },
  {
    id: 'company-field',
    type: 'guestField',
    x: 50,
    y: 100,
    width: 300,
    height: 30,
    rotation: 0,
    zIndex: 2,
    visible: true,
    guestField: 'company',
    fontSize: 18,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    color: '#475569',
    textAlign: 'center'
  },
  {
    id: 'qr-field',
    type: 'guestField',
    x: 150,
    y: 200,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 3,
    visible: true,
    guestField: 'qrCode'
  },
  {
    id: 'guest-type-field',
    type: 'guestField',
    x: 50,
    y: 320,
    width: 300,
    height: 30,
    rotation: 0,
    zIndex: 4,
    visible: true,
    guestField: 'guestType',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center'
  }
];

const SimpleBadge: React.FC<SimpleBadgeProps> = ({ attendee, template }) => {
  // Use provided template or fall back to default
  const badgeTemplate = template || DEFAULT_BADGE_TEMPLATE;

  // Validate attendee data
  if (!attendee || !attendee.guest) {
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center" style={{ width: 400, height: 400 }}>
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    );
  }

  // Get guest data
  const guest = attendee.guest;
  let guestTypeName = '';
  
  if (attendee.guest_type) {
    if (typeof attendee.guest_type === 'object' && attendee.guest_type !== null) {
      guestTypeName = attendee.guest_type.name || String(attendee.guest_type.id) || '';
    } else if (typeof attendee.guest_type === 'string') {
      guestTypeName = attendee.guest_type;
    } else {
      guestTypeName = String(attendee.guest_type);
    }
  }

  // Guest data mapping
  const guestData = {
    name: guest?.name || '',
    company: guest?.company || '',
    jobTitle: guest?.jobtitle || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    guestType: guestTypeName || '',
    qrCode: 'REG-' + String(attendee.id).padStart(8, '0') // UNIFIED QR VALUE - Use confirmation code format
  };

  // Get value for guest field
  const getGuestFieldValue = (field: string): string => {
    return guestData[field as keyof typeof guestData] || '';
  };

  // Render individual element
  const renderElement = (element: BadgeElement) => {
    if (!element.visible) return null;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      zIndex: element.zIndex
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                            element.textAlign === 'right' ? 'flex-end' : 'flex-start'
            }}
          >
            {element.content}
          </div>
        );

      case 'guestField':
        const fieldValue = getGuestFieldValue(element.guestField || '');
        
        // Special handling for QR code
        if (element.guestField === 'qrCode') {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QRCode 
                value={fieldValue} 
                size={Math.min(element.width, element.height)} 
              />
            </div>
          );
        }

        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                            element.textAlign === 'right' ? 'flex-end' : 'flex-start'
            }}
          >
            {fieldValue}
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundImage: element.src ? `url(${element.src})` : 'none',
              backgroundColor: element.src ? 'transparent' : '#f3f4f6',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: 12
            }}
          >
            {!element.src && 'Image'}
          </div>
        );

      case 'shape':
        const shapeStyle: React.CSSProperties = {
          ...baseStyle,
          backgroundColor: element.backgroundColor,
          border: `${element.borderWidth}px solid ${element.borderColor}`,
          borderRadius: element.shapeType === 'circle' ? '50%' : 0
        };

        return (
          <div
            key={element.id}
            style={shapeStyle}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col items-center border rounded-lg shadow-lg bg-white relative"
      style={{ 
        width: 400, // 4 inches = 400 points (100mm)
        height: 400, // 4 inches = 400 points (100mm)
        padding: 0 
      }}
    >
      {/* Render all template elements */}
      {badgeTemplate.map(renderElement)}
    </div>
  );
};

export default SimpleBadge;
