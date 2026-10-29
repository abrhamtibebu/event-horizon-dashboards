import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import { fetchPublicInvitation } from '@/lib/api/invitations';
import { guestFirstName, type PublicInvitation } from '@/types/invitations';
import type { SubmissionResult } from '@/types/forms';
import DynamicFormRenderer from '@/components/public/DynamicFormRenderer';
import { RsvpLanding } from '@/components/public/RsvpLanding';
import { SpinnerInline } from '@/components/ui/spinner';
import { RegistrationUnavailable, type RegistrationUnavailableVariant } from '@/components/public/RegistrationUnavailable';
import { useRegistrationShareMeta } from '@/lib/registrationShareMeta';
import { richTextToPlain } from '@/lib/rich-text';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; invitation: PublicInvitation }
  | { kind: 'unavailable'; variant: RegistrationUnavailableVariant; eventName?: string | null; message?: string };

/**
 * Build the /registration/success URL for a completed RSVP.
 */
function successUrl(params: {
  attendeeId: number | string;
  eventId: number | string;
  eventUuid: string;
  eventName: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  guestUuid?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  invitationCode: string;
}): string {
  const q = new URLSearchParams({
    attendeeId: String(params.attendeeId),
    eventId: String(params.eventId),
    eventUuid: params.eventUuid,
    eventName: params.eventName,
    eventDate: params.eventDate ?? '',
    eventLocation: params.eventLocation ?? '',
    guestUuid: params.guestUuid ?? '',
    guestName: params.guestName ?? '',
    guestEmail: params.guestEmail ?? '',
    inv: params.invitationCode,
  });
  return `/registration/success?${q.toString()}`;
}

export default function EventRsvp() {
  const { code = '' } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [declined, setDeclined] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [noCustomForm, setNoCustomForm] = useState(false);
  const trackedRef = useRef(false);

  const invitation = state.kind === 'ready' ? state.invitation : null;
  const event = invitation?.event ?? null;

  useRegistrationShareMeta({
    enabled: Boolean(event?.name),
    title: event?.name,
    description: typeof event?.description === 'string' ? richTextToPlain(event.description) : undefined,
    imageRaw: event?.image_url ?? undefined,
    eventId: event?.id,
  });

  const load = useCallback(async () => {
    if (!code) {
      setState({ kind: 'unavailable', variant: 'not-found' });
      return;
    }
    setState({ kind: 'loading' });
    try {
      const inv = await fetchPublicInvitation(code);
      setDeclined(inv.rsvp_status === 'declined');
      setState({ kind: 'ready', invitation: inv });
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { reason?: string; data?: { event?: { name?: string } } } } })?.response;
      const status = response?.status;
      const reason = response?.data?.reason;
      const eventName = response?.data?.data?.event?.name ?? null;
      if (status === 410 || reason === 'expired' || reason === 'revoked') {
        setState({
          kind: 'unavailable',
          variant: 'inactive',
          eventName,
          message:
            reason === 'revoked'
              ? 'This invitation was withdrawn by the organizer. Please contact them if you believe this is a mistake.'
              : 'This invitation link has expired. Please contact the organizer for a new one.',
        });
      } else {
        setState({ kind: 'unavailable', variant: 'not-found', message: 'We could not find this invitation. Check the link in your email and try again.' });
      }
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  // Track the click once per page view.
  useEffect(() => {
    if (!invitation || trackedRef.current) return;
    trackedRef.current = true;
    api.post('/invitations/track-click', { invitation_code: invitation.invitation_code, referrer: document.referrer }).catch(() => {});
  }, [invitation]);

  // A return visit after the guest submitted the form. Opening the link does not confirm.
  useEffect(() => {
    if (!invitation || !event) return;
    if (invitation.rsvp_status === 'accepted' && invitation.attendee) {
      navigate(
        successUrl({
          attendeeId: invitation.attendee.id,
          eventId: event.id,
          eventUuid: event.uuid,
          eventName: event.name,
          eventDate: event.start_date,
          eventLocation: event.venue_name || event.location,
          guestUuid: invitation.attendee.guest_uuid,
          guestName: invitation.attendee.guest_name,
          guestEmail: invitation.attendee.guest_email,
          invitationCode: invitation.invitation_code,
        }),
        { replace: true },
      );
    }
  }, [invitation, event, navigate]);

  // Ticketed events use the purchase flow.
  useEffect(() => {
    if (event?.event_type === 'ticketed') {
      navigate(`/tickets/purchase/${event.id}?inv=${encodeURIComponent(code)}`, { replace: true });
    }
  }, [event, code, navigate]);

  const postRsvp = useCallback(
    async (status: 'accepted' | 'declined') => {
      if (!invitation) return;
      setRsvpBusy(true);
      try {
        await api.post('/invitations/rsvp', { invitation_code: invitation.invitation_code, status });
        setDeclined(status === 'declined');
        if (status === 'declined') toast.info('Thanks for letting us know.');
      } catch {
        toast.error('Could not save your response. Please try again.');
      } finally {
        setRsvpBusy(false);
      }
    },
    [invitation],
  );

  // ?decline=1 from the email: record the decline immediately.
  const declineParamHandled = useRef(false);
  useEffect(() => {
    if (!invitation || declineParamHandled.current) return;
    if (searchParams.get('decline') === '1' && !invitation.already_registered && invitation.rsvp_status !== 'declined') {
      declineParamHandled.current = true;
      void postRsvp('declined');
    }
  }, [invitation, searchParams, postRsvp]);

  // No active custom form for this guest type: fall back to the standard form.
  useEffect(() => {
    if (!noCustomForm || !event) return;
    navigate(`/event/register/${event.uuid}?inv=${encodeURIComponent(code)}&fallback=1`, { replace: true });
  }, [noCustomForm, event, code, navigate]);

  const handleSuccess = useCallback(
    (result?: SubmissionResult) => {
      if (!invitation || !event) return;
      type GuestLite = { uuid?: string; name?: string; email?: string };
      const attendee = result?.attendee as (SubmissionResult['attendee'] & { guest?: GuestLite }) | undefined;
      const guest = (result as (SubmissionResult & { guest?: GuestLite }) | undefined)?.guest;
      const guestUuid = attendee?.guest?.uuid || guest?.uuid || '';
      toast.success('RSVP confirmed! Your e-badge is on its way.');
      navigate(
        successUrl({
          attendeeId: attendee?.id ?? '',
          eventId: event.id,
          eventUuid: event.uuid,
          eventName: event.name,
          eventDate: event.start_date,
          eventLocation: event.venue_name || event.location,
          guestUuid,
          guestName: attendee?.guest?.name || guest?.name || invitation.recipient_name,
          guestEmail: attendee?.guest?.email || guest?.email || invitation.recipient_email,
          invitationCode: invitation.invitation_code,
        }),
        { replace: true },
      );
    },
    [invitation, event, navigate],
  );

  if (state.kind === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <SpinnerInline className="mx-auto" />
          <p className="mt-4 text-muted-foreground">Opening your invitation…</p>
        </div>
      </div>
    );
  }

  if (state.kind === 'unavailable') {
    return <RegistrationUnavailable variant={state.variant} eventName={state.eventName} message={state.message} />;
  }

  if (!invitation || !event) {
    return <RegistrationUnavailable variant="not-found" />;
  }

  if ((invitation.rsvp_status === 'accepted' && invitation.attendee) || event.event_type === 'ticketed' || noCustomForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SpinnerInline />
      </div>
    );
  }

  // Event lifecycle gate.
  const now = new Date();
  const eventEnd = event.end_date ? new Date(event.end_date) : null;
  if (eventEnd && !Number.isNaN(eventEnd.getTime()) && eventEnd < now) {
    return <RegistrationUnavailable variant="event-passed" eventName={event.name} eventStartDate={event.start_date} />;
  }
  if (event.status && event.status !== 'active') {
    return <RegistrationUnavailable variant="inactive" eventName={event.name} />;
  }

  const guestTypeName = invitation.guest_type?.name || invitation.invitation_type;

  return (
    <RsvpLanding
      eventName={event.name}
      description={event.description}
      startDate={event.start_date}
      venueName={event.venue_name}
      location={event.location}
      imageUrl={event.image_url}
      organizerName={event.organizer?.name}
      organizerLogo={event.organizer?.logo || event.organizer_logo}
      guestTypeName={guestTypeName}
      guestFirstName={guestFirstName(invitation.recipient_name)}
      settings={event.rsvp_page}
      declined={declined}
      rsvpBusy={rsvpBusy}
      onDecline={() => postRsvp('declined')}
      onUndecline={() => postRsvp('accepted')}
    >
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-inner">
        {invitation.guest_type_id ? (
          <DynamicFormRenderer
            eventId={event.id}
            guestTypeId={invitation.guest_type_id}
            invitationCode={invitation.invitation_code}
            prefill={{
              name: invitation.recipient_name,
              email: invitation.recipient_email,
              phone: invitation.recipient_phone,
              company: invitation.guest_details?.company,
              jobTitle: invitation.guest_details?.job_title,
              location: invitation.guest_details?.location,
            }}
            submitLabel="Confirm RSVP"
            onSuccess={handleSuccess}
            onError={(msg) => toast.error(msg)}
            onFallback={() => setNoCustomForm(true)}
          />
        ) : (
          <LegacyFallback onReady={() => setNoCustomForm(true)} />
        )}
      </div>
    </RsvpLanding>
  );
}

function LegacyFallback({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return (
    <div className="py-8 text-center">
      <SpinnerInline className="mx-auto" />
    </div>
  );
}
