import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvitationGenerator } from './InvitationGenerator';
import { SocialShareButtons } from './SocialShareButtons';
import { InvitationAnalytics } from './InvitationAnalytics';
import { InvitationsList } from './InvitationsList';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Sparkles } from 'lucide-react';

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
  const navigate = useNavigate();
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
      <Card className="p-4 bg-info/10 border-info/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-info dark:text-info mb-1">Invitation Tracking</h4>
            <p className="text-sm text-info/80 dark:text-info/70">
              Generate unique invitation links to track who clicks, shares, and registers for your event.
              {eventType === 'ticketed' 
                ? ' Track ticket purchases from your invitations!' 
                : ' Registered guests will automatically be assigned as "Visitor" type.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Custom Registration Button for Event ID 33 */}
      {eventId === 33 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Custom Registration Form</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Access the specialized registration form for this event with enhanced fields and document uploads
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/event/custom-register/${eventId}`)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Custom Registration
            </Button>
          </div>
        </Card>
      )}

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
          <Card className="p-6 flex items-center justify-center bg-muted/50">
            <div className="text-center text-muted-foreground">
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

