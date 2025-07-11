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
  
  return content
    .replace(/{fullName}/g, guest?.name || '')
    .replace(/{firstName}/g, guest?.name?.split(' ')[0] || '')
    .replace(/{lastName}/g, guest?.name?.split(' ').slice(1).join(' ') || '')
    .replace(/{company}/g, guest?.company || '')
    .replace(/{jobTitle}/g, guest?.jobtitle || '')
    .replace(/{email}/g, guest?.email || '')
    .replace(/{phone}/g, guest?.phone || '')
    .replace(/{country}/g, guest?.country || '')
    .replace(/{guestType}/g, guest?.guestType || '')
    .replace(/{uuid}/g, guest?.uuid || guest?.id?.toString() || '')
    .replace(/{profilePicture}/g, guest?.profile_picture || '');
};

// Legacy badge component (fallback)
const LegacyBadge: React.FC<{ attendee: Attendee }> = ({ attendee }) => {
  const name = attendee.guest?.name || '';
  const company = attendee.guest?.company || '';
  const jobtitle = attendee.guest?.jobtitle || '';
  const country = attendee.guest?.country || '';
  const guestType = attendee.guestType?.name || '';
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

const Badge: React.FC<BadgeProps> = ({ attendee }) => {
  // Validate attendee data
  if (!attendee || !attendee.guest) {
    return (
      <div className="border rounded-xl shadow-lg bg-white p-8 text-center">
        <div className="text-red-500">Invalid attendee data</div>
      </div>
    )
  }
  return <LegacyBadge attendee={attendee} />;
};

export default Badge; 