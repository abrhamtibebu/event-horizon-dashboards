import React from 'react';
import * as QRCodeReact from 'qrcode.react';
import { Attendee } from '@/types/attendee';
import { BadgeTemplate } from '@/types/badge';

const guestTypeColors: Record<string, string> = {
  Guest: 'bg-blue-700',
  VIP: 'bg-yellow-500',
  Speaker: 'bg-purple-700',
  Staff: 'bg-green-700',
  // Add more types as needed
};

interface BadgeProps {
  attendee: Attendee;
  template?: BadgeTemplate | null;
}

// Helper function to replace template placeholders with actual data
const replaceTemplateFields = (content: string, attendee: Attendee): string => {
  const guest = attendee.guest;
  const guestType = attendee.guestType;
  
  return content
    .replace(/{fullName}/g, guest?.name || '')
    .replace(/{firstName}/g, guest?.name?.split(' ')[0] || '')
    .replace(/{lastName}/g, guest?.name?.split(' ').slice(1).join(' ') || '')
    .replace(/{company}/g, guest?.company || '')
    .replace(/{jobTitle}/g, guest?.jobtitle || '')
    .replace(/{email}/g, guest?.email || '')
    .replace(/{phone}/g, guest?.phone || '')
    .replace(/{country}/g, guest?.country || '')
    .replace(/{guestType}/g, guestType?.name || 'Guest')
    .replace(/{uuid}/g, guest?.uuid || guest?.id?.toString() || '')
    .replace(/{profilePicture}/g, guest?.profile_picture || '');
};

// Render template-based badge
const TemplateBadge: React.FC<{ template: BadgeTemplate; attendee: Attendee }> = ({ template, attendee }) => {
  const templateData = template.template_json;
  const frontElements = templateData?.front?.elements || [];
  const backElements = templateData?.back?.elements || [];
  const frontBackground = templateData?.front?.background;
  const backBackground = templateData?.back?.background;
  
  console.log('TemplateBadge rendering with:', {
    frontElements: frontElements.length,
    backElements: backElements.length,
    frontBackground: !!frontBackground,
    backBackground: !!backBackground
  });

  const renderElement = (element: any, side: 'front' | 'back') => {
    try {
      const content = replaceTemplateFields(element.content || '', attendee);
      
      switch (element.type) {
        case 'text':
          return (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                fontFamily: element.fontFamily || 'Arial',
                fontSize: element.fontSize || 16,
                fontWeight: element.fontWeight || 'normal',
                color: element.color || '#000000',
                textAlign: element.textAlign || 'left',
                transform: `rotate(${element.rotation || 0}deg)`,
                zIndex: element.zIndex || 1,
              }}
            >
              {content}
            </div>
          );
      
      case 'image':
        const imageSrc = element.src === '{profilePicture}' 
          ? (attendee.guest?.profile_picture || '/placeholder-avatar.svg')
          : element.src;
        return (
          <img
            key={element.id}
            src={imageSrc}
            alt=""
            style={{
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation || 0}deg)`,
              zIndex: element.zIndex || 1,
            }}
          />
        );
      
      case 'qr':
        const qrValue = element.value === '{uuid}' 
          ? (attendee.guest?.uuid || attendee.guest?.id?.toString() || '')
          : replaceTemplateFields(element.value || '', attendee);
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation || 0}deg)`,
              zIndex: element.zIndex || 1,
            }}
          >
            <QRCodeReact.QRCode value={qrValue} size={Math.min(element.width, element.height)} />
          </div>
        );
      
      case 'rect':
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              backgroundColor: element.fill || '#000000',
              transform: `rotate(${element.rotation || 0}deg)`,
              zIndex: element.zIndex || 1,
            }}
          />
        );
      
      default:
        console.warn(`Unknown element type: ${element.type}`);
        return null;
    }
    } catch (error) {
      console.error(`Error rendering element ${element.id}:`, error);
      return null;
    }
  };

  return (
    <div className="flex gap-4">
      {/* Front Side */}
      <div
        className="relative border rounded-xl shadow-lg bg-white"
        style={{ 
          width: 400, 
          height: 600,
          backgroundImage: frontBackground ? `url(${frontBackground})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {frontElements.map((element: any) => renderElement(element, 'front'))}
      </div>
      
      {/* Back Side */}
      <div
        className="relative border rounded-xl shadow-lg bg-white"
        style={{ 
          width: 400, 
          height: 600,
          backgroundImage: backBackground ? `url(${backBackground})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {backElements.map((element: any) => renderElement(element, 'back'))}
      </div>
    </div>
  );
};

// Legacy badge component (fallback)
const LegacyBadge: React.FC<{ attendee: Attendee }> = ({ attendee }) => {
  const name = attendee.guest?.name || '';
  const company = attendee.guest?.company || '';
  const jobtitle = attendee.guest?.jobtitle || '';
  const country = attendee.guest?.country || '';
  const guestType = attendee.guestType?.name || 'Guest';
  const uuid = attendee.guest?.uuid || attendee.guest?.id || '';
  const barColor = guestTypeColors[guestType] || 'bg-gray-700';

  return (
    <div
      className="flex flex-col items-center justify-between border rounded-xl shadow-lg bg-white relative"
      style={{ width: 320, height: 480, padding: 24 }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-center leading-tight mt-2 mb-4" style={{ wordBreak: 'break-word' }}>{name}</div>
        <div className="text-xl text-center mt-2 mb-1">{company}</div>
        <div className="text-lg text-center mb-1">{jobtitle}</div>
        <div className="text-lg text-center mb-4">{country}</div>
        <div className="flex justify-center my-4">
          <QRCodeReact.QRCode value={String(uuid)} size={128} />
        </div>
      </div>
      <div className={`w-full py-3 text-center text-white text-2xl font-bold rounded-b-xl ${barColor}`} style={{ position: 'absolute', left: 0, bottom: 0 }}>
        {guestType.toUpperCase()}
      </div>
    </div>
  );
};

const Badge: React.FC<BadgeProps> = ({ attendee, template }) => {
  console.log('Badge component rendering with:', { attendee, template })
  
  // Validate attendee data
  if (!attendee || !attendee.guest) {
    console.error('Invalid attendee data:', attendee)
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center">
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    )
  }
  
  // If we have a template, use the template-based badge
  if (template && template.template_json) {
    console.log('Using template badge')
    console.log('Template JSON:', template.template_json)
    try {
      // Validate template structure
      if (!template.template_json.front && !template.template_json.back) {
        console.warn('Template missing front/back structure, falling back to legacy badge')
        return <LegacyBadge attendee={attendee} />;
      }
      
      return <TemplateBadge template={template} attendee={attendee} />;
    } catch (error) {
      console.error('Error rendering template badge:', error)
      console.log('Falling back to legacy badge')
      return <LegacyBadge attendee={attendee} />;
    }
  }
  
  // Otherwise, fall back to the legacy badge
  console.log('Using legacy badge')
  return <LegacyBadge attendee={attendee} />;
};

export default Badge; 