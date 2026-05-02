import { useState } from 'react';
import { InvitationGenerator } from './InvitationGenerator';
import { SocialShareButtons } from './SocialShareButtons';
import { InvitationAnalytics } from './InvitationAnalytics';
import { InvitationsList } from './InvitationsList';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link as LinkIcon,
  UserCheck, 
  TrendingUp,
  Briefcase,
  Crown
} from 'lucide-react';
import { useInvitationStats } from '@/lib/api/invitations';

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
  const { data: stats } = useInvitationStats(eventId);
  const [currentInvitation, setCurrentInvitation] = useState<{
    code: string;
    url: string;
  } | null>(null);

  const handleInvitationGenerated = (invitation: { code: string; url: string }) => {
    setCurrentInvitation(invitation);
  };

  return (
    <div className="space-y-6">
      {/* Minimal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Links', value: stats?.total_invitations || 0, icon: LinkIcon, color: 'text-blue-500' },
          { label: 'Clicks', value: stats?.total_clicks || 0, icon: TrendingUp, color: 'text-indigo-500' },
          { label: 'RSVP Responses', value: stats?.total_registrations || 0, icon: UserCheck, color: 'text-emerald-500' },
          { label: 'Conversion', value: `${stats?.conversion_rate || 0}%`, icon: UserCheck, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-card border border-border rounded-xl">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-6">
          <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 py-2">
            All Invitations
          </TabsTrigger>
          <TabsTrigger value="exhibitors" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 py-2">
            Exhibitors
          </TabsTrigger>
          <TabsTrigger value="vip-media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 py-2">
            VIP & Media
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 py-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          <TabsContent value="all" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <InvitationGenerator
                  eventId={eventId}
                  eventUuid={eventUuid}
                  eventName={eventName}
                  isOrganizer={isOrganizer}
                  onGenerated={handleInvitationGenerated}
                />
              </div>
              <div className="lg:col-span-2">
                <InvitationsList
                  eventId={eventId}
                  isOrganizer={isOrganizer}
                />
              </div>
            </div>
            
            {currentInvitation && (
              <Card className="p-4 bg-muted/20 border-border border-dashed">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Recently generated: <code className="text-primary">{currentInvitation.code}</code></p>
                  <SocialShareButtons
                    invitationUrl={currentInvitation.url}
                    invitationCode={currentInvitation.code}
                    eventName={eventName}
                    eventType={eventType}
                  />
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exhibitors" className="mt-0">
            <InvitationsList
              eventId={eventId}
              isOrganizer={isOrganizer}
              filterType="exhibitor"
              title="Exhibitor Invitations"
            />
          </TabsContent>

          <TabsContent value="vip-media" className="mt-0">
            <InvitationsList
              eventId={eventId}
              isOrganizer={isOrganizer}
              filterType={['vip', 'media', 'speaker']}
              title="VIP & Press Invitations"
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <InvitationAnalytics
              eventId={eventId}
              userId={user?.id ? parseInt(user.id) : undefined}
              isOrganizer={isOrganizer}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}



