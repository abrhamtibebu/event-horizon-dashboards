import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

/**
 * Redirect component for the new standalone Badge Designer app
 * Redirects from Event Horizon to the Laravel-hosted Badge Designer SPA
 */
export function BadgeDesignerRedirect() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to the integrated Badge Designer
    const badgeDesignerUrl = eventId 
      ? `/badge-designer/templates/${eventId}`
      : `/badge-designer/templates/1`; // Default to event 1 if no eventId

    // Use React Router navigation
    navigate(badgeDesignerUrl)
  }, [eventId, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Badge Designer...</p>
      </div>
    </div>
  )
}

export default BadgeDesignerRedirect


