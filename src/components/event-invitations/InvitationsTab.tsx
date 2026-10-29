import { useRef } from 'react';
import { InvitationGenerator } from './InvitationGenerator';
import { InvitationAnalytics } from './InvitationAnalytics';
import { InvitationsList } from './InvitationsList';
import { RsvpPageSettingsCard, type RsvpEventPreview } from './RsvpPageSettings';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Mail, Users } from 'lucide-react';
import { useInvitationStats } from '@/lib/api/invitations';

interface InvitationsTabProps {
  eventId: number;
  eventUuid: string;
  eventName: string;
  eventType: 'free' | 'ticketed';
  isOrganizer: boolean;
  eventPreview?: RsvpEventPreview;
}

export function InvitationsTab({ eventId, eventUuid, eventName, isOrganizer, eventPreview }: InvitationsTabProps) {
  const { user } = useAuth();
  const { data: stats } = useInvitationStats(eventId);
  const listRef = useRef<HTMLDivElement>(null);

  const invited = stats?.total_invitations ?? 0;
  const sent = stats?.email?.sent ?? 0;
  const failed = stats?.email?.failed ?? 0;
  const confirmed = stats?.rsvp?.accepted ?? 0;

  const cards = [
    { label: 'Invited', value: invited, icon: Users, color: 'text-blue-500' },
    { label: 'Emails sent', value: sent, icon: Mail, color: 'text-indigo-500' },
    { label: 'Failed', value: failed, icon: AlertTriangle, color: failed > 0 ? 'text-rose-500' : 'text-slate-400' },
    {
      label: 'RSVP confirmed',
      value: `${confirmed}${invited > 0 ? ` (${Math.round((confirmed / invited) * 100)}%)` : ''}`,
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((stat) => (
          <div key={stat.label} className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="guests" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-6">
          <TabsTrigger
            value="guests"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 py-2"
          >
            Guests & RSVPs
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 py-2"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="guests" className="mt-0 space-y-6">
            <RsvpPageSettingsCard
              eventId={eventId}
              isOrganizer={isOrganizer}
              event={eventPreview ?? { name: eventName }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <InvitationGenerator
                  eventId={eventId}
                  eventUuid={eventUuid}
                  eventName={eventName}
                  isOrganizer={isOrganizer}
                  onSent={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
              </div>
              <div className="lg:col-span-2" ref={listRef}>
                <InvitationsList eventId={eventId} isOrganizer={isOrganizer} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <InvitationAnalytics eventId={eventId} userId={user?.id ? Number(user.id) : undefined} isOrganizer={isOrganizer} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

