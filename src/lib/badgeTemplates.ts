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
    // Get all templates for the event
    const response = await api.get<any>(`/events/${eventId}/badge-templates`);
    const templates = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    
    // Find the default template or return the first one
    const defaultTemplate = templates.find((t: any) => t.is_default) || templates[0];
    
    return { data: defaultTemplate || null };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      // No templates found, return null
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
