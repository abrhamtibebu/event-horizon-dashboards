import { useState } from 'react';
import { BarChart3, CheckCheck, Mail, Settings2, UsersRound } from 'lucide-react';
import { InvitationGenerator } from './InvitationGenerator';
import { InvitationAnalytics } from './InvitationAnalytics';
import { InvitationsList } from './InvitationsList';
import { RsvpPageSettingsCard, type RsvpEventPreview } from './RsvpPageSettings';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState('invite');
  const invited = stats?.total_invitations ?? 0;
  const sent = stats?.email?.sent ?? 0;
  const accepted = stats?.rsvp?.accepted ?? 0;
  const pending = stats?.rsvp?.pending ?? 0;
  const summary = [
    { label: 'Invited', value: invited, icon: UsersRound },
    { label: 'Email delivered', value: sent, icon: Mail },
    { label: 'Accepted', value: accepted, icon: CheckCheck },
    { label: 'Awaiting response', value: pending, icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
          <div><p className="text-[11px] font-medium text-muted-foreground">{label}</p><p className="text-lg font-semibold leading-tight">{value}</p></div>
        </div>)}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 sm:grid-cols-4">
          <TabsTrigger value="invite" className="gap-2 rounded-lg py-2.5 text-xs sm:text-sm"><Mail className="h-4 w-4" />Invite guests</TabsTrigger>
          <TabsTrigger value="guests" className="gap-2 rounded-lg py-2.5 text-xs sm:text-sm"><UsersRound className="h-4 w-4" />Guest list</TabsTrigger>
          <TabsTrigger value="experience" className="gap-2 rounded-lg py-2.5 text-xs sm:text-sm"><Settings2 className="h-4 w-4" />RSVP experience</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 rounded-lg py-2.5 text-xs sm:text-sm"><BarChart3 className="h-4 w-4" />Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="invite" className="mt-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4"><h2 className="text-lg font-semibold">Invite people to your event</h2><p className="mt-1 text-sm text-muted-foreground">Add guests one at a time or import a spreadsheet. Each guest gets a personal RSVP link.</p></div>
            <InvitationGenerator eventId={eventId} eventUuid={eventUuid} eventName={eventName} isOrganizer={isOrganizer} onSent={() => setActiveTab('guests')} />
          </div>
        </TabsContent>

        <TabsContent value="guests" className="mt-5"><InvitationsList eventId={eventId} isOrganizer={isOrganizer} title="Invited guests" /></TabsContent>

        <TabsContent value="experience" className="mt-5">
          <RsvpPageSettingsCard eventId={eventId} isOrganizer={isOrganizer} event={eventPreview ?? { name: eventName }} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-5"><InvitationAnalytics eventId={eventId} userId={user?.id ? Number(user.id) : undefined} isOrganizer={isOrganizer} /></TabsContent>
      </Tabs>
    </div>
  );
}
