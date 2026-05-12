import React from 'react';
import QRCode from 'react-qr-code';
import { Attendee } from '@/types/attendee';

// ── Legacy BadgeElement (backward compatibility) ──────────────────────────────

export interface BadgeElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'shape' | 'guestField';
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
  zIndex?: number;
  visible?: boolean;
  guestField?: string;
  shapeType?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

// ── Designer Element Types (from badge-designer.ts) ───────────────────────────

interface DesignerElement {
  id: string;
  type: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex?: number;
  // Text properties
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: string;
  verticalAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number;
  // Dynamic field
  fieldKey?: string;
  // Image
  src?: string;
  objectFit?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  // QR Code
  dataSource?: string;
  customValue?: string;
  foregroundColor?: string;
  errorCorrection?: string;
  // Shape
  shapeType?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

interface BadgeSide {
  elements: DesignerElement[];
  backgroundColor: string;
  backgroundImage: string | null;
}

interface BadgeLayout {
  size: string;
  orientation: string;
  front: BadgeSide;
  back: BadgeSide;
}

// ── Badge Size Constants ──────────────────────────────────────────────────────

const BADGE_SIZES: Record<string, { width: number; height: number }> = {
  A6_PORTRAIT: { width: 105, height: 148 },
  A6_LANDSCAPE: { width: 148, height: 105 },
  CR80: { width: 85.6, height: 53.98 },
  CUSTOM_4X4: { width: 100, height: 100 },
  CUSTOM_4X6: { width: 100, height: 150 },
};

const MM_TO_PX = 3.78;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SimpleBadgeProps {
  attendee: Attendee;
  template?: BadgeElement[];
  designerLayout?: BadgeLayout;
  side?: 'front' | 'back';
}

// ── Guest Data Helper ─────────────────────────────────────────────────────────

function extractGuestData(attendee: Attendee) {
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

  return {
    firstName: guest?.name?.split(' ')[0] || '',
    lastName: guest?.name?.split(' ').slice(1).join(' ') || '',
    fullName: guest?.name || '',
    name: guest?.name || '',
    company: guest?.company || '',
    jobTitle: guest?.jobtitle || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    guestType: guestTypeName,
    ticketType: '',
    qrCode: 'REG-' + String(attendee.id).padStart(8, '0'),
    attendeePhoto: guest?.profile_picture || '',
    customField1: '',
    customField2: '',
    customField3: '',
    uuid: guest?.uuid || (guest?.id ? String(guest.id) : ''),
    profilePicture: guest?.profile_picture || '',
  };
}

// ── Replace Legacy Template Placeholders ──────────────────────────────────────

function replaceTemplatePlaceholders(content: string, data: ReturnType<typeof extractGuestData>): string {
  return content
    .replace(/{fullName}/g, data.fullName)
    .replace(/{firstName}/g, data.firstName)
    .replace(/{lastName}/g, data.lastName)
    .replace(/{company}/g, data.company)
    .replace(/{jobTitle}/g, data.jobTitle)
    .replace(/{email}/g, data.email)
    .replace(/{phone}/g, data.phone)
    .replace(/{guestType}/g, data.guestType)
    .replace(/{uuid}/g, data.uuid)
    .replace(/{profilePicture}/g, data.profilePicture)
    .replace(/{country}/g, '');
}

// ── Default badge template if no custom template is provided ──────────────────

const DEFAULT_BADGE_TEMPLATE: BadgeElement[] = [
  {
    id: 'name-field', type: 'guestField', x: 50, y: 50, width: 300, height: 40,
    rotation: 0, zIndex: 1, visible: true, guestField: 'name',
    fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', color: '#1e293b', textAlign: 'center',
  },
  {
    id: 'company-field', type: 'guestField', x: 50, y: 100, width: 300, height: 30,
    rotation: 0, zIndex: 2, visible: true, guestField: 'company',
    fontSize: 18, fontFamily: 'Arial', fontWeight: 'normal', color: '#475569', textAlign: 'center',
  },
  {
    id: 'qr-field', type: 'guestField', x: 150, y: 200, width: 100, height: 100,
    rotation: 0, zIndex: 3, visible: true, guestField: 'qrCode',
  },
  {
    id: 'guest-type-field', type: 'guestField', x: 50, y: 320, width: 300, height: 30,
    rotation: 0, zIndex: 4, visible: true, guestField: 'guestType',
    fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', color: '#1e40af', textAlign: 'center',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SimpleBadge: React.FC<SimpleBadgeProps> = ({ attendee, template, designerLayout, side = 'front' }) => {
  // Validate attendee data
  if (!attendee || !attendee.guest) {
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center" style={{ width: 400, height: 400 }}>
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    );
  }

  const guestData = extractGuestData(attendee);

  // ── Designer Layout Renderer ────────────────────────────────────────────
  if (designerLayout) {
    const badgeSide = designerLayout[side] || designerLayout.front;
    const sizeConfig = BADGE_SIZES[designerLayout.size] || BADGE_SIZES.CUSTOM_4X4;
    const widthPx = Math.round(sizeConfig.width * MM_TO_PX);
    const heightPx = Math.round(sizeConfig.height * MM_TO_PX);

    const renderDesignerElement = (element: DesignerElement) => {
      if (element.visible === false) return null;

      const baseStyle: React.CSSProperties = {
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        opacity: element.opacity ?? 1,
        zIndex: element.zIndex ?? 0,
      };

      switch (element.type) {
        case 'text': {
          const resolvedContent = replaceTemplatePlaceholders(element.content || '', guestData);
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                fontSize: element.fontSize,
                fontFamily: element.fontFamily,
                fontWeight: element.fontWeight as any,
                fontStyle: element.fontStyle as any,
                textDecoration: element.textDecoration !== 'none' ? element.textDecoration : undefined,
                color: element.color,
                backgroundColor: element.backgroundColor && element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
                textAlign: element.textAlign as any,
                lineHeight: element.lineHeight ?? 1.2,
                letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
                padding: element.padding ? `${element.padding}px` : undefined,
                display: 'flex',
                alignItems: element.verticalAlign === 'bottom' ? 'flex-end' : element.verticalAlign === 'middle' ? 'center' : 'flex-start',
                justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {resolvedContent}
            </div>
          );
        }

        case 'dynamicField': {
          const fieldValue = guestData[element.fieldKey as keyof typeof guestData] || '';

          // Special handling for QR code field
          if (element.fieldKey === 'qrCode') {
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: element.backgroundColor && element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
                }}
              >
                <QRCode
                  value={String(fieldValue || guestData.qrCode)}
                  size={Math.min(element.width, element.height) - (element.padding ? element.padding * 2 : 8)}
                />
              </div>
            );
          }

          // Special handling for attendee photo
          if (element.fieldKey === 'attendeePhoto') {
            return (
              <div
                key={element.id}
                style={{
                  ...baseStyle,
                  backgroundImage: fieldValue ? `url(${fieldValue})` : 'none',
                  backgroundColor: fieldValue ? 'transparent' : '#f3f4f6',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: element.borderRadius ?? 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: 12,
                }}
              >
                {!fieldValue && 'Photo'}
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
                fontWeight: element.fontWeight as any,
                fontStyle: element.fontStyle as any,
                color: element.color,
                backgroundColor: element.backgroundColor && element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
                textAlign: element.textAlign as any,
                lineHeight: element.lineHeight ?? 1.2,
                padding: element.padding ? `${element.padding}px` : undefined,
                display: 'flex',
                alignItems: element.verticalAlign === 'bottom' ? 'flex-end' : element.verticalAlign === 'middle' ? 'center' : 'flex-start',
                justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {fieldValue}
            </div>
          );
        }

        case 'image': {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                backgroundImage: element.src ? `url(${element.src})` : 'none',
                backgroundColor: element.src ? 'transparent' : '#f3f4f6',
                backgroundSize: element.objectFit || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: element.borderRadius ?? 0,
                border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || '#d1d5db'}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: 12,
              }}
            >
              {!element.src && 'Image'}
            </div>
          );
        }

        case 'qrCode': {
          let qrValue = guestData.qrCode;
          if (element.dataSource === 'attendeeId') {
            qrValue = String(attendee.id);
          } else if (element.dataSource === 'confirmationCode') {
            qrValue = guestData.qrCode;
          } else if (element.dataSource === 'customUrl' && element.customValue) {
            qrValue = element.customValue;
          } else if (element.dataSource === 'vCard') {
            qrValue = `BEGIN:VCARD\nVERSION:3.0\nN:${guestData.lastName};${guestData.firstName}\nFN:${guestData.fullName}\nORG:${guestData.company}\nTITLE:${guestData.jobTitle}\nEMAIL:${guestData.email}\nTEL:${guestData.phone}\nEND:VCARD`;
          }

          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: element.backgroundColor && element.backgroundColor !== '#FFFFFF' ? element.backgroundColor : undefined,
              }}
            >
              <QRCode
                value={qrValue}
                size={Math.min(element.width, element.height) - 8}
                fgColor={element.foregroundColor || '#000000'}
                bgColor="transparent"
                level={element.errorCorrection || 'M'}
              />
            </div>
          );
        }

        case 'shape': {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                backgroundColor: element.fill || 'transparent',
                border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.stroke || '#000'}` : 'none',
                borderRadius: element.shapeType === 'circle' || element.shapeType === 'ellipse'
                  ? '50%'
                  : element.cornerRadius ?? 0,
              }}
            />
          );
        }

        default:
          return null;
      }
    };

    return (
      <div
        className="printable-badge relative"
        style={{
          width: widthPx,
          height: heightPx,
          backgroundColor: badgeSide.backgroundColor || '#FFFFFF',
          backgroundImage: badgeSide.backgroundImage ? `url(${badgeSide.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          pageBreakInside: 'avoid',
        }}
      >
        {[...badgeSide.elements]
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map(renderDesignerElement)}
      </div>
    );
  }

  // ── Legacy Template Renderer ────────────────────────────────────────────
  const badgeTemplate = template || DEFAULT_BADGE_TEMPLATE;

  const getGuestFieldValue = (field: string): string => {
    return guestData[field as keyof typeof guestData] || '';
  };

  const renderLegacyElement = (element: BadgeElement) => {
    if (element.visible === false) return null;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: element.zIndex,
    };

    switch (element.type) {
      case 'text': {
        const resolvedContent = replaceTemplatePlaceholders(element.content || '', guestData);
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign as any,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' :
                            element.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {resolvedContent}
          </div>
        );
      }

      case 'guestField': {
        const fieldValue = getGuestFieldValue(element.guestField || '');

        if (element.guestField === 'qrCode') {
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRCode
                value={fieldValue}
                size={Math.min(element.width || 100, element.height || 100)}
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
              textAlign: element.textAlign as any,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' :
                            element.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {fieldValue}
          </div>
        );
      }

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
              fontSize: 12,
            }}
          >
            {!element.src && 'Image'}
          </div>
        );

      case 'shape': {
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.backgroundColor,
              border: `${element.borderWidth || 0}px solid ${element.borderColor || 'transparent'}`,
              borderRadius: element.shapeType === 'circle' ? '50%' : 0,
            }}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col items-center border rounded-lg shadow-lg bg-white relative printable-badge"
      style={{
        width: 400,
        height: 400,
        padding: 0,
      }}
    >
      {badgeTemplate.map(renderLegacyElement)}
    </div>
  );
};

export default SimpleBadge;
