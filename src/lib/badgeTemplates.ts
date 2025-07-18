import api from './api'
import { BadgeTemplate, BadgeTemplateVersion } from '../types/badge'

export const getBadgeTemplates = (eventId: number) =>
  api.get<BadgeTemplate[]>(`/events/${eventId}/badge-templates`)

export const getBadgeTemplate = (eventId: number, templateId: number) =>
  api.get<BadgeTemplate>(`/events/${eventId}/badge-templates/${templateId}`)

export const createBadgeTemplate = (
  eventId: number,
  data: Partial<BadgeTemplate>
) => api.post<BadgeTemplate>(`/events/${eventId}/badge-templates`, data)

export const updateBadgeTemplate = (
  eventId: number,
  templateId: number,
  data: Partial<BadgeTemplate>
) =>
  api.put<BadgeTemplate>(
    `/events/${eventId}/badge-templates/${templateId}`,
    data
  )

export const deleteBadgeTemplate = (eventId: number, templateId: number) =>
  api.delete(`/events/${eventId}/badge-templates/${templateId}`)

export const publishBadgeTemplate = (eventId: number, templateId: number) =>
  api.post<BadgeTemplate>(
    `/events/${eventId}/badge-templates/${templateId}/publish`
  )

export const getOfficialBadgeTemplate = async (eventId: number) => {
  try {
    return await api.get<BadgeTemplate>(`/events/${eventId}/badge-templates-official`);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      // No official template found, return null or a default
      return { data: null };
    }
    throw error;
  }
};

export const getBadgeTemplateVersions = (eventId: number, templateId: number) =>
  api.get<BadgeTemplateVersion[]>(
    `/events/${eventId}/badge-templates/${templateId}/versions`
  )

export const getBadgeTemplateDrafts = (eventId: number) =>
  api.get<BadgeTemplate[]>(`/events/${eventId}/badge-templates-drafts`)

export const getDeletedBadgeTemplates = (eventId: number) =>
  api.get<BadgeTemplate[]>(`/events/${eventId}/badge-templates-deleted`)
