import { useState } from 'react';
import { InvitationGenerator } from './InvitationGenerator';
import { SocialShareButtons } from './SocialShareButtons';
import { InvitationAnalytics } from './InvitationAnalytics';
import { InvitationsList } from './InvitationsList';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface InvitationsTabProps {
  eventId: number;
  eventUuid: string;
  eventName: string;
  eventType: 'free' | 'ticketed';
  isOrganizer: boolean;
}

export function InvitationsTab({
  eventId,
  eventUuid,
  eventName,
  eventType,
  isOrganizer
}: InvitationsTabProps) {
  const { user } = useAuth();
  const [currentInvitation, setCurrentInvitation] = useState<{
    code: string;
    url: string;
  } | null>(null);

  // State to hold generated invitation for sharing
  const handleInvitationGenerated = (invitation: { code: string; url: string }) => {
    setCurrentInvitation(invitation);
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Invitation Tracking</h4>
            <p className="text-sm text-blue-800">
              Generate unique invitation links to track who clicks, shares, and registers for your event.
              {eventType === 'ticketed' 
                ? ' Track ticket purchases from your invitations!' 
                : ' Registered guests will automatically be assigned as "Visitor" type.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Generator and Share Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvitationGenerator
          eventId={eventId}
          eventUuid={eventUuid}
          eventName={eventName}
          isOrganizer={isOrganizer}
        />

        {currentInvitation ? (
          <SocialShareButtons
            invitationUrl={currentInvitation.url}
            invitationCode={currentInvitation.code}
            eventName={eventName}
            eventType={eventType}
          />
        ) : (
          <Card className="p-6 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="font-medium">Generate an invitation link first</p>
              <p className="text-sm mt-1">Then share it via social media</p>
            </div>
          </Card>
        )}
      </div>

      {/* Analytics Dashboard */}
      <InvitationAnalytics
        eventId={eventId}
        userId={user?.id ? parseInt(user.id) : undefined}
        isOrganizer={isOrganizer}
      />

      {/* Invitations List */}
      <InvitationsList
        eventId={eventId}
        userId={!isOrganizer && user?.id ? parseInt(user.id) : undefined}
        isOrganizer={isOrganizer}
      />
    </div>
  );
}

