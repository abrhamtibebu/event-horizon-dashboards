import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import api from '@/lib/api'

interface OrganizerStatus {
  id: number
  name: string
  status: string
  suspended_at?: string
  suspended_reason?: string
}

export function useOrganizerStatus() {
  const { user } = useAuth()
  const [organizerStatus, setOrganizerStatus] = useState<OrganizerStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)

  useEffect(() => {
    const checkOrganizerStatus = async () => {
      if (!user || user.role !== 'organizer') {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get('/organizer/profile')
        const organizer = response.data
        
        setOrganizerStatus(organizer)
        setIsSuspended(organizer.status === 'suspended')
      } catch (error: any) {
        if (error.response?.status === 403 && error.response?.data?.error === 'Organizer is suspended') {
          // Organizer is suspended
          setOrganizerStatus({
            id: user.organizer_id || 0,
            name: user.organizer?.name || 'Your Organization',
            status: 'suspended'
          })
          setIsSuspended(true)
        } else {
          // Other error, assume not suspended
          setIsSuspended(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkOrganizerStatus()
  }, [user])

  const blockActivity = (activity: string) => {
    if (isSuspended) {
      throw new Error(`This action is blocked because your organizer account (${organizerStatus?.name}) is suspended. Please contact the system administrator.`)
    }
  }

  return {
    organizerStatus,
    isLoading,
    isSuspended,
    blockActivity
  }
} 