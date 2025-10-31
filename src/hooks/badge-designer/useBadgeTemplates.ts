import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { toast } from 'sonner'

export function useBadgeTemplates(eventId: number) {
  return useQuery({
    queryKey: ['badge-templates', eventId],
    queryFn: async () => {
      const response = await api.getBadgeTemplates(String(eventId))
      return response.data
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBadgeTemplate(eventId: number, templateId: number) {
  return useQuery({
    queryKey: ['badge-template', eventId, templateId],
    queryFn: async () => {
      const response = await api.getBadgeTemplate(String(eventId), String(templateId))
      return response.data
    },
    enabled: !!templateId && templateId > 0,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveBadgeTemplate(eventId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { name: string; template_json: any; is_default?: boolean }) => {
      const response = await api.createBadgeTemplate(String(eventId), data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-templates', eventId] })
      toast.success('Badge template saved successfully!')
    },
    onError: (error: any) => {
      toast.error('Failed to save badge template')
      console.error(error)
    },
  })
}

export function useUpdateBadgeTemplate(eventId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ templateId, data }: { 
      templateId: number
      data: { name?: string; template_json?: any; is_default?: boolean }
    }) => {
      const response = await api.updateBadgeTemplate(String(eventId), String(templateId), data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-templates', eventId] })
      toast.success('Badge template updated successfully!')
    },
    onError: (error: any) => {
      toast.error('Failed to update badge template')
      console.error(error)
    },
  })
}

export function useDeleteBadgeTemplate(eventId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (templateId: number) => {
      const response = await api.deleteBadgeTemplate(String(eventId), String(templateId))
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-templates', eventId] })
      toast.success('Badge template deleted successfully!')
    },
    onError: (error: any) => {
      toast.error('Failed to delete badge template')
      console.error(error)
    },
  })
}

export function useEvent(eventId: number) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.getEvent(String(eventId))
      return response.data
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSampleAttendee(eventId: number) {
  return useQuery({
    queryKey: ['sample-attendee', eventId],
    queryFn: async () => {
      const response = await api.getAttendees(String(eventId))
      return response.data[0] // Get first attendee as sample
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })
}


