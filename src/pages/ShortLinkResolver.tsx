import { useEffect, useState } from 'react'
import { SpinnerInline } from '@/components/ui/spinner'
import { useParams, useNavigate } from 'react-router-dom'
import { resolveShortLink } from '@/lib/api'
import { toast } from 'sonner'

export default function ShortLinkResolver() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const resolveLink = async () => {
      if (!shortCode) {
        toast.error('Invalid short link')
        navigate('/')
        return
      }

      try {
        const response = await resolveShortLink(shortCode)
        
        if (response.status === 200) {
          const { event_id, registration_data } = response.data
          
          // Create a token with the resolved data in the expected nested format
          const token = btoa(JSON.stringify({
            eventId: event_id,
            payment: {
              dailyRate: registration_data.dailyRate,
              method: registration_data.paymentMethod,
              terms: registration_data.paymentTerms,
            },
            requirements: {
              notes: registration_data.requirements,
              dressCode: registration_data.dressCode,
              arrivalTime: registration_data.arrivalTime,
            },
            limits: {
              maxUshers: registration_data.maxUshers,
              validFrom: registration_data.validFrom,
              validUntil: registration_data.validUntil,
            },
            message: registration_data.customMessage,
          }))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
          
          // Redirect to the registration page with the token
          navigate(`/usher/register?t=${token}`)
        } else {
          toast.error('Short link not found or expired')
          navigate('/')
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Short link not found')
        } else if (error.response?.status === 410) {
          toast.error('Short link has expired')
        } else {
          toast.error('Failed to resolve short link')
        }
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    resolveLink()
  }, [shortCode, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <SpinnerInline className="mx-auto mb-4" />
          <p className="text-gray-600">Resolving short link...</p>
        </div>
      </div>
    )
  }

  return null
}
