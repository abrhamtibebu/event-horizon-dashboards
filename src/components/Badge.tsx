import React from 'react';
import * as QRCodeReact from 'qrcode.react';
import { Attendee } from '@/types/attendee';

const guestTypeColors: Record<string, string> = {
  Guest: 'bg-blue-700',
  VIP: 'bg-yellow-500',
  Speaker: 'bg-purple-700',
  Staff: 'bg-green-700',
  // Add more types as needed
};

const Badge: React.FC<{ attendee: Attendee }> = ({ attendee }) => {
  console.log('Badge attendee:', attendee);
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

export default Badge; 