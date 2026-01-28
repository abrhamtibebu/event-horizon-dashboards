import React from 'react';
import QRCode from 'react-qr-code';
import { Attendee } from '@/types/attendee';
import { BadgeTemplate } from '@/types/badge';
import { calculateNameFontSize, calculateCompanyFontSize, calculateJobTitleFontSize } from '@/lib/nameSizing';
import SimpleBadge from './SimpleBadge';
import { BadgeElement } from './SimpleBadge';

interface BadgeProps {
  attendee: Attendee;
  template?: BadgeTemplate | null;
  customTemplate?: BadgeElement[]; // New prop for custom template elements
}

// Helper function to replace template placeholders with actual data
const replaceTemplateFields = (content: string, attendee: Attendee): string => {
  const guest = attendee.guest;
  // Use guest_type instead of guestType
  const guest_type = attendee.guest_type;
  
  // Handle guest type properly - extract name from object or use string directly
  let guestTypeName = '';
  if (guest_type) {
    if (typeof guest_type === 'object' && guest_type !== null) {
      guestTypeName = guest_type.name || String(guest_type.id) || '';
    } else if (typeof guest_type === 'string') {
      guestTypeName = guest_type;
    } else {
      guestTypeName = String(guest_type);
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
    .replace(/{country}/g, '')
    .replace(/{guestType}/g, guestTypeName)
    .replace(/{uuid}/g, guest?.uuid || (guest?.id ? String(guest.id) : '') || '')
    .replace(/{profilePicture}/g, guest?.profile_picture || '');
};

// Legacy badge component (fallback) - Updated for 4"x4" (100mm x 100mm)
const LegacyBadge: React.FC<{ attendee: Attendee }> = ({ attendee }) => {
  const name = attendee.guest?.name || '';
  const company = attendee.guest?.company || '';
  const jobtitle = attendee.guest?.jobtitle || '';
  const country = '';
  // Use guest_type instead of guestType
  let guest_type = '';
  if (attendee.guest_type && typeof attendee.guest_type === 'object' && attendee.guest_type !== null) {
    guest_type = attendee.guest_type.name || String(attendee.guest_type.id) || '';
  } else if (typeof attendee.guest_type === 'string') {
    guest_type = attendee.guest_type;
  }
  const uuid = (attendee.guest?.uuid || '').slice(0, 12);

  // Calculate dynamic font sizes based on text length
  const nameFontSize = calculateNameFontSize(name);
  const companyFontSize = calculateCompanyFontSize(company);
  const jobTitleFontSize = calculateJobTitleFontSize(jobtitle);

  return (
    <div
      className="flex flex-col items-center border rounded-lg shadow-lg bg-white relative printable-badge"
      style={{ 
        width: 400, // 4 inches = 400 points (100mm)
        height: 400, // 4 inches = 400 points (100mm)
        padding: 0,
        pageBreakInside: 'avoid',
        pageBreakAfter: 'avoid',
        pageBreakBefore: 'avoid',
      }}
    >
      {/* Main content area - now uses full space */}
      <div className="flex flex-col items-center justify-center px-6 py-8" style={{ 
        width: '100%', 
        height: '100%',
        minHeight: 0 
      }}>
        {/* Name - dynamic sizing based on length */}
        <div className="w-full text-center font-bold mb-4" style={{ 
          fontSize: nameFontSize, 
          lineHeight: 1.1,
          color: '#1e293b',
          fontFamily: 'Helvetica, Arial, sans-serif'
        }}>
          {name}
        </div>
        
        {/* Company and Job Title - dynamic sizing */}
        <div className="w-full text-center mb-6">
          <div style={{ 
            fontSize: companyFontSize, 
            color: '#475569', 
            marginBottom: 4, 
            fontWeight: 600,
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}>
            {company}
          </div>
          <div style={{ 
            fontSize: jobTitleFontSize, 
            color: '#64748b', 
            fontWeight: 500,
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}>
            {jobtitle}
          </div>
        {/* Guest Country - if available */}
        {country && (
          <div style={{ 
            fontSize: 15,
            color: '#1e293b',
            fontWeight: 400,
            fontFamily: 'Helvetica, Arial, sans-serif',
            marginTop: 2
          }}>
            {country}
          </div>
        )}
        </div>

        {/* QR code - larger to fill more space */}
        <div className="flex justify-center mb-4">
          <QRCode value={String(uuid)} size={140} />
        </div>

        {/* Badge ID */}
        <div style={{ 
          fontSize: 14, 
          color: '#64748b', 
          marginBottom: 6, 
          fontWeight: 500,
          fontFamily: 'Helvetica, Arial, sans-serif'
        }}>
          ID: {uuid}
        </div>

        {/* Guest type - bolder and more prominent */}
        <div style={{ 
          fontSize: 22, 
          fontWeight: 800, 
          color: '#1e40af',
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontFamily: 'Helvetica, Arial, sans-serif'
        }}>
          {guest_type ? guest_type : 'VISITOR'}
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<BadgeProps> = ({ attendee, template, customTemplate }) => {
  // Validate attendee data
  if (!attendee || !attendee.guest) {
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center">
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    )
  }

  // Use custom template if provided, otherwise fall back to legacy badge
  if (customTemplate && customTemplate.length > 0) {
    return <SimpleBadge attendee={attendee} template={customTemplate} />;
  }

  // Use official badge template if provided
  if (template && template.template_json) {
    try {
      const templateElements = Array.isArray(template.template_json) 
        ? template.template_json 
        : template.template_json.elements || [];
      
      if (templateElements.length > 0) {
        return <SimpleBadge attendee={attendee} template={templateElements} />;
      }
    } catch (error) {
      console.warn('Failed to parse badge template, using fallback:', error);
    }
  }

  // Always use the legacy badge (basic design) as fallback
  return <LegacyBadge attendee={attendee} />;
};

export default Badge; 