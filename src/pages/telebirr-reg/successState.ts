import type { TelebirrEventData, TelebirrRegistrationData, TelebirrRegistrationSuccessState } from './types'

export type RegistrationApiPayload = {
  attendee?: unknown
  event?: Partial<TelebirrEventData> | null
  message?: string
}

/** Supports Axios responses and already-unwrapped JSON bodies. */
export function extractRegistrationApiPayload(response: unknown): RegistrationApiPayload {
  if (!response || typeof response !== 'object') {
    return {}
  }

  const root = response as Record<string, unknown>
  const axiosBody = root.data

  if (axiosBody && typeof axiosBody === 'object' && !Array.isArray(axiosBody)) {
    const body = axiosBody as Record<string, unknown>
    return {
      attendee: body.attendee,
      event: (body.event as Partial<TelebirrEventData>) ?? null,
      message: typeof body.message === 'string' ? body.message : undefined,
    }
  }

  return {
    attendee: root.attendee,
    event: (root.event as Partial<TelebirrEventData>) ?? null,
    message: typeof root.message === 'string' ? root.message : undefined,
  }
}

export function mergeSuccessStates(
  routerState: TelebirrRegistrationSuccessState | null,
  persistedState: TelebirrRegistrationSuccessState | null,
): TelebirrRegistrationSuccessState | null {
  if (!routerState && !persistedState) {
    return null
  }
  if (!routerState) {
    return persistedState
  }
  if (!persistedState) {
    return routerState
  }

  return {
    registrationData: {
      ...persistedState.registrationData,
      ...routerState.registrationData,
      id: routerState.registrationData.id ?? persistedState.registrationData.id,
      guest_uuid:
        routerState.registrationData.guest_uuid ?? persistedState.registrationData.guest_uuid,
    },
    eventData: {
      ...persistedState.eventData,
      ...routerState.eventData,
      id: routerState.eventData.id ?? persistedState.eventData.id,
      uuid: routerState.eventData.uuid ?? persistedState.eventData.uuid,
    },
  }
}

export function normalizeRegistrationData(data: unknown): TelebirrRegistrationData | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const rawId = record.id ?? record.attendee_id ?? record.attendeeId
  let id: number | undefined

  if (typeof rawId === 'number' && rawId > 0) {
    id = rawId
  } else if (typeof rawId === 'string' && rawId.trim() !== '') {
    const parsed = Number(rawId)
    if (!Number.isNaN(parsed) && parsed > 0) {
      id = parsed
    }
  }

  const guestUuid = (record.guest_uuid ?? record.guestUuid) as string | undefined

  if (!id) {
    if (!guestUuid?.trim()) {
      return null
    }

    return {
      id: 0,
      guest_uuid: guestUuid,
      guest_name: (record.guest_name ?? record.guestName) as string | undefined,
      guest_email: (record.guest_email ?? record.guestEmail) as string | undefined,
      guest_phone: (record.guest_phone ?? record.guestPhone) as string | undefined,
      guest_job_title: (record.guest_job_title ?? record.guestJobTitle) as string | undefined,
      guest_company: (record.guest_company ?? record.guestCompany) as string | undefined,
      registration_code: (record.registration_code ?? record.registrationCode) as string | undefined,
    }
  }

  return {
    id,
    guest_uuid: (record.guest_uuid ?? record.guestUuid) as string | undefined,
    guest_name: (record.guest_name ?? record.guestName) as string | undefined,
    guest_email: (record.guest_email ?? record.guestEmail) as string | undefined,
    guest_phone: (record.guest_phone ?? record.guestPhone) as string | undefined,
    guest_job_title: (record.guest_job_title ?? record.guestJobTitle) as string | undefined,
    guest_company: (record.guest_company ?? record.guestCompany) as string | undefined,
    registration_code: (record.registration_code ?? record.registrationCode) as string | undefined,
  }
}

export function mergeEventData(
  base: TelebirrEventData,
  partial?: Partial<TelebirrEventData> | null,
): TelebirrEventData {
  if (!partial) {
    return base
  }

  return {
    ...base,
    ...partial,
    id: base.id ?? partial.id,
    uuid: base.uuid ?? partial.uuid,
    name: base.name || partial.name || '',
    description: base.description || partial.description || '',
  }
}

export function buildSuccessState(
  registrationData: TelebirrRegistrationData,
  eventData: TelebirrEventData,
  apiEvent?: Partial<TelebirrEventData> | null,
): TelebirrRegistrationSuccessState {
  return {
    registrationData,
    eventData: mergeEventData(eventData, apiEvent),
  }
}
