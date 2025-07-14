import React from 'react';
import QRCode from 'react-qr-code';
import { Attendee } from '@/types/attendee';
import { BadgeTemplate } from '@/types/badge';


interface BadgeProps {
  attendee: Attendee;
  template?: BadgeTemplate | null;
}

// Helper function to replace template placeholders with actual data
const replaceTemplateFields = (content: string, attendee: Attendee): string => {
  const guest = attendee.guest;
  const guestType = attendee.guestType;
  
  // Handle guest type properly - extract name from object or use string directly
  let guestTypeName = '';
  if (guestType) {
    if (typeof guestType === 'object' && guestType !== null) {
      guestTypeName = guestType.name || guestType.id || '';
    } else if (typeof guestType === 'string') {
      guestTypeName = guestType;
    } else {
      guestTypeName = String(guestType);
    }
  }
  
  return content
    .replace(/{fullName}/g, guest?.name || '')
    .replace(/{firstName}/g, guest?.name?.split(' ')[0] || '')
    .replace(/{lastName}/g, guest?.name?.split(' ').slice(1).join(' ') || '')
    .replace(/{company}/g, guest?.company || '')
    .replace(/{jobTitle}/g, guest?.jobtitle || '')
    .replace(/{email}/g, guest?.email || '')
    .replace(/{phone}/g, guest?.phone || '')
    .replace(/{country}/g, guest?.country || '')
    .replace(/{guestType}/g, guestTypeName)
    .replace(/{uuid}/g, guest?.uuid || guest?.id?.toString() || '')
    .replace(/{profilePicture}/g, guest?.profile_picture || '');
};

// Legacy badge component (fallback)
const LegacyBadge: React.FC<{ attendee: Attendee }> = ({ attendee }) => {
  const name = attendee.guest?.name || '';
  const company = attendee.guest?.company || '';
  const jobtitle = attendee.guest?.jobtitle || '';
  const country = attendee.guest?.country || '';
  
  console.log('DEBUG - LegacyBadge attendee:', attendee);
  console.log('DEBUG - LegacyBadge attendee.guestType:', attendee.guestType);
  
  // Fix: fallback to guestType?.name or guest_type if guestType is missing
  let guestType = '';
  if (attendee.guestType && typeof attendee.guestType === 'object' && attendee.guestType !== null) {
    guestType = attendee.guestType.name || attendee.guestType.id || '';
    console.log('DEBUG - LegacyBadge extracted from object:', guestType);
  } else if (typeof attendee.guestType === 'string') {
    guestType = attendee.guestType;
    console.log('DEBUG - LegacyBadge is string:', guestType);
  } else if (attendee.guest_type) {
    guestType = String(attendee.guest_type);
    console.log('DEBUG - LegacyBadge from guest_type:', guestType);
  }
  
  console.log('DEBUG - LegacyBadge final guestType:', guestType);
  
  const uuid = (attendee.guest?.uuid || '').slice(0, 12);
  // Color code the bar based on guest type
  // const barColor = guestTypeColors[guestType] || 'bg-gray-700';

  return (
    <div
      className="flex flex-col items-center justify-between border rounded-xl shadow-lg bg-white relative"
      style={{ width: 320, height: 480, padding: 24 }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        {/* Name */}
        <div className="text-4xl font-bold text-center leading-tight mt-2 mb-4" style={{ wordBreak: 'break-word' }}>{name}</div>
        {/* Company */}
        <div className="text-xl text-center mb-1">{company}</div>
        {/* Title */}
        <div className="text-lg text-center mb-1">{jobtitle}</div>
        {/* Country */}
        <div className="text-lg text-center mb-4">{country}</div>
        {/* QR code with uuid */}
        <div className="flex justify-center my-4">
          <QRCode value={String(uuid)} size={128} />
        </div>
        {/* Guest type below QR code */}
        <div className="w-full text-center text-3xl font-extrabold tracking-widest mt-2" style={{ letterSpacing: 2, color: '#111' }}>
          {guestType ? guestType.toUpperCase() : ''}
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<BadgeProps> = ({ attendee, template }) => {
  // Validate attendee data
  if (!attendee || !attendee.guest) {
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center">
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    )
  }

  // If no template is provided, use the legacy badge
  if (!template) {
    return <LegacyBadge attendee={attendee} />;
  }

  // Extract template data - handle both direct template objects and BadgeTemplate objects
  const templateData = template.template_json || template;
  const { width, height, backgroundColor, backgroundImage, elements } = templateData;

  // Use the template system
  return (
    <div
      className="relative border rounded-xl shadow-lg bg-white"
      style={{ 
        width: width || 320, 
        height: height || 480,
        background: backgroundColor || '#FFFFFF',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover'
      }}
    >
      {elements?.map(element => {
        const content = element.type === 'text' ? replaceTemplateFields((element as any).content, attendee) : '';
        
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex,
              transform: `rotate(${element.rotation}deg)`,
            }}
          >
            {element.type === 'text' && (
              <span
                style={{
                  fontFamily: (element as any).fontFamily || 'Arial',
                  fontSize: (element as any).fontSize || 18,
                  color: (element as any).color || '#000',
                  fontWeight: (element as any).fontWeight || 'normal',
                  textAlign: (element as any).textAlign || 'left',
                  display: 'block',
                  width: '100%',
                  height: '100%',
                }}
              >
                {content}
              </span>
            )}
            {element.type === 'image' && (
              <img
                src={replaceTemplateFields((element as any).src, attendee)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {element.type === 'qr' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRCode 
                  value={replaceTemplateFields('{uuid}', attendee)} 
                  size={Math.min(element.width, element.height)} 
                />
              </div>
            )}
            {element.type === 'shape' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: (element as any).backgroundColor || '#eee',
                  border: `${(element as any).borderWidth || 1}px solid ${(element as any).borderColor || '#ccc'}`,
                  borderRadius: (element as any).shapeType === 'circle' ? '50%' : undefined,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Badge; 