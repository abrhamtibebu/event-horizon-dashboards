import React from 'react';
import Badge from './Badge';
import { Attendee } from '@/types/attendee';
import { BadgeTemplate } from '@/types/badge';

interface BadgeTestProps {
  attendee: Attendee;
  template?: BadgeTemplate | null;
}

const BadgeTest: React.FC<BadgeTestProps> = ({ attendee, template }) => {
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Badge Test Component</h3>
      <div className="border p-4">
        <Badge attendee={attendee} template={template} />
      </div>
    </div>
  );
};

export default BadgeTest; 