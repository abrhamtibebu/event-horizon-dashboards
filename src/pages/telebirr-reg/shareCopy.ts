export const TELEBIRR_SHARE_MESSAGE_BODY =
  "I'll be attending the telebirr 5th Year Anniversary Exhibition!\n\n" +
  'Join me from June 23–26, 2026 at the Ethiopian Skylight Hotel, Addis Ababa and be part of this milestone moment in Ethiopia\'s digital finance journey.\n\n' +
  'Grab your spot:'

export function buildPreregistrationUrl(
  eventUuid: string,
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  return `${origin}/event/register/${eventUuid}?type=prereg`
}

export function buildTelebirrShareCaption(
  eventUuid: string,
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const registrationLink = buildPreregistrationUrl(eventUuid, origin)
  return `${TELEBIRR_SHARE_MESSAGE_BODY} ${registrationLink}`
}
