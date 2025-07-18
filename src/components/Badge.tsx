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
  // Use guest_type instead of guestType
  const guestType = attendee.guest_type;
  
  // Handle guest type properly - extract name from object or use string directly
  let guestTypeName = '';
  if (guestType) {
    if (typeof guestType === 'object' && guestType !== null) {
      guestTypeName = guestType.name || String(guestType.id) || '';
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
    .replace(/{country}/g, '')
    .replace(/{guestType}/g, guestTypeName)
    .replace(/{uuid}/g, guest?.uuid || (guest?.id ? String(guest.id) : '') || '')
    .replace(/{profilePicture}/g, guest?.profile_picture || '');
};

// Legacy badge component (fallback)
const LegacyBadge: React.FC<{ attendee: Attendee }> = ({ attendee }) => {
  const name = attendee.guest?.name || '';
  const company = attendee.guest?.company || '';
  const jobtitle = attendee.guest?.jobtitle || '';
  const country = '';
  // Use guest_type instead of guestType
  let guestType = '';
  if (attendee.guest_type && typeof attendee.guest_type === 'object' && attendee.guest_type !== null) {
    guestType = attendee.guest_type.name || String(attendee.guest_type.id) || '';
  } else if (typeof attendee.guest_type === 'string') {
    guestType = attendee.guest_type;
  }
  const uuid = (attendee.guest?.uuid || '').slice(0, 12);

  return (
    <div
      className="flex flex-col items-center border rounded-xl shadow-lg bg-white relative"
      style={{ width: 320, height: 480, padding: 0 }}
    >
      {/* Name */}
      <div className="w-full text-center font-bold" style={{ fontSize: 40, marginTop: 32, marginBottom: 16, lineHeight: 1.1 }}>
        {name}
      </div>
      {/* Company, Job Title, Country */}
      <div className="w-full text-center" style={{ fontSize: 22, marginBottom: 4 }}>{company}</div>
      <div className="w-full text-center" style={{ fontSize: 20, marginBottom: 4 }}>{jobtitle}</div>
      <div className="w-full text-center" style={{ fontSize: 20, marginBottom: 4 }}>{country}</div>
      {/* QR code */}
      <div className="flex justify-center" style={{ marginBottom: -4 }}>
        <QRCode value={String(uuid)} size={140} />
      </div>
      {/* Guest type at the bottom, no background */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      }}>
        <span style={{ color: '#111', fontWeight: 700, fontSize: 32, letterSpacing: 2 }}>
          {guestType ? guestType.toUpperCase() : ''}
        </span>
      </div>
    </div>
  );
};

const Badge: React.FC<BadgeProps> = ({ attendee }) => {
  // Validate attendee data
  if (!attendee || !attendee.guest) {
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center">
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    )
  }
  // Always use the legacy badge (basic design)
  return <LegacyBadge attendee={attendee} />;
};

export default Badge; 