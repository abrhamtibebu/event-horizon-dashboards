import React from 'react';
import * as QRCodeReact from 'qrcode.react';
import { BadgeTemplate, BadgeElement, PAGE_SIZES } from '../types/badge';
import { Attendee } from '@/types/attendee'; // Assuming an attendee type exists

const QRCode = QRCodeReact.default || QRCodeReact;

// Convert mm to px for display (assuming 96 DPI)
const mmToPx = (mm: number) => (mm / 25.4) * 96;

interface BadgeProps {
  template: BadgeTemplate;
  attendee: Attendee;
}

const ElementRenderer: React.FC<{ element: BadgeElement; attendee: Attendee }> = ({ element, attendee }) => {
  const style = {
    position: 'absolute' as 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
  };

  switch (element.type) {
    case 'text':
      const nameParts = attendee.guest?.name?.split(' ') || ['', ''];
      const content = element.content
        .replace('{firstName}', nameParts[0])
        .replace('{lastName}', nameParts.slice(1).join(' '))
        .replace('{fullName}', attendee.guest?.name || '')
        .replace('{jobTitle}', attendee.guest?.jobtitle || '')
        .replace('{company}', attendee.guest?.company || '')
        .replace('{guestType}', attendee.guestType?.name || '')
        .replace('{email}', attendee.guest?.email || '')
        .replace('{phone}', attendee.guest?.phone || '')
        .replace('{profileImage}', attendee.guest?.profile_image_url || '');

      return (
        <div
          style={{
            ...style,
            fontFamily: element.fontFamily,
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight,
            color: element.color,
            textAlign: element.textAlign,
          }}
        >
          {content}
        </div>
      );
    case 'image':
      // For now, only handles attendee profile pictures
      let imageUrl = element.src;
      if (element.src === '{profilePicture}' || element.src === '{profileImage}') {
        imageUrl = attendee.guest?.profile_image_url || 'https://via.placeholder.com/150';
      } else if (element.src?.includes('{profileImage}')) {
        imageUrl = element.src.replace('{profileImage}', attendee.guest?.profile_image_url || 'https://via.placeholder.com/150');
      }
      return <img src={imageUrl} alt="badge element" style={style} />;
    case 'qr':
      const qrNameParts = attendee.guest?.name?.split(' ') || ['', ''];
      const vCard = `BEGIN:VCARD
VERSION:3.0
N:${qrNameParts.slice(1).join(' ')};${qrNameParts[0]}
FN:${attendee.guest?.name || ''}
ORG:${attendee.guest?.company || ''}
TITLE:${attendee.guest?.jobtitle || ''}
EMAIL:${attendee.guest?.email || ''}
TEL:${attendee.guest?.phone || ''}
END:VCARD`;
      return (
        <div style={style}>
          <QRCode value={vCard} size={element.width} />
        </div>
      );
    case 'shape':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.backgroundColor,
            borderColor: element.borderColor,
            borderWidth: `${element.borderWidth}px`,
            borderStyle: 'solid',
            borderRadius: element.shapeType === 'ellipse' ? '50%' : '0',
          }}
        />
      );
    default:
      return null;
  }
};

const Badge: React.FC<BadgeProps> = ({ template, attendee }) => {
  const dimensions = PAGE_SIZES[template.pageSize];
  const badgeStyle = {
    width: `${mmToPx(dimensions.width)}px`,
    height: `${mmToPx(dimensions.height)}px`,
    backgroundColor: template.backgroundColor,
    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
    position: 'relative' as 'relative',
    overflow: 'hidden',
  };

  return (
    <div className="shadow-lg bg-cover bg-center" style={badgeStyle}>
      {template.elements.map(element => <ElementRenderer key={element.id} element={element} attendee={attendee} />)}
    </div>
  );
};

export default Badge; 