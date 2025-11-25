import api from './api'
import type { CustomField, CustomFieldResponse, AttendeeCustomFieldResponses } from '@/types/customFields'

/**
 * Get custom fields for an event
 */
export const getEventCustomFields = async (
  eventId: number,
  guestTypeId?: number,
  includeArchived = false
): Promise<CustomField[]> => {
  const params: any = {}
  if (guestTypeId) {
    params.guest_type_id = guestTypeId
  }
  if (includeArchived) {
    params.include_archived = true
  }

  const response = await api.get(`/events/${eventId}/custom-fields`, { params })
  return response.data
}

/**
 * Get custom fields for public registration (by UUID)
 */
export const getPublicEventCustomFields = async (
  eventUuid: string,
  guestTypeId?: number,
  visibilityScope: 'registration' | 'internal' | 'both' = 'registration'
): Promise<CustomField[]> => {
  const params: any = { visibility_scope: visibilityScope }
  if (guestTypeId) {
    params.guest_type_id = guestTypeId
  }

  const response = await api.get(`/public/events/${eventUuid}/custom-fields`, { params })
  return response.data
}

/**
 * Create a custom field
 */
export const createCustomField = async (
  eventId: number,
  field: Omit<CustomField, 'id' | 'event_id' | 'version' | 'is_archived' | 'created_by' | 'updated_by'>
): Promise<CustomField> => {
  const response = await api.post(`/events/${eventId}/custom-fields`, field)
  return response.data
}

/**
 * Update a custom field
 */
export const updateCustomField = async (
  eventId: number,
  fieldId: number,
  field: Partial<CustomField>
): Promise<CustomField> => {
  const response = await api.put(`/events/${eventId}/custom-fields/${fieldId}`, field)
  return response.data
}

/**
 * Delete (archive) a custom field
 */
export const deleteCustomField = async (eventId: number, fieldId: number): Promise<void> => {
  await api.delete(`/events/${eventId}/custom-fields/${fieldId}`)
}

/**
 * Reorder custom fields
 */
export const reorderCustomFields = async (eventId: number, fieldIds: number[]): Promise<void> => {
  await api.put(`/events/${eventId}/custom-fields/reorder`, { field_ids: fieldIds })
}

/**
 * Get custom field responses (unified endpoint)
 * Without attendeeId: Get all responses for event
 * With attendeeId: Get responses for specific attendee
 */
export const getCustomFieldResponses = async (
  eventId: number,
  attendeeId?: number
): Promise<AttendeeCustomFieldResponses[] | CustomFieldResponse[]> => {
  const params: any = {}
  if (attendeeId) {
    params.attendee_id = attendeeId
  }

  const response = await api.get(`/events/${eventId}/custom-field-responses`, { params })
  return response.data
}

/**
 * Export custom field responses
 */
export const exportCustomResponses = async (
  eventId: number,
  format: 'csv' | 'excel' = 'csv'
): Promise<Blob> => {
  const response = await api.get(`/events/${eventId}/custom-field-responses/export`, {
    params: { format },
    responseType: 'blob',
  })
  return response.data
}

/**
 * Get signed URL for file download
 */
export const getCustomFieldFileUrl = async (fileId: string): Promise<string> => {
  const response = await api.get(`/custom-field-files/${fileId}`)
  return response.data.url
}




