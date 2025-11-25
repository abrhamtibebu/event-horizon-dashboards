import EventPublicationManager from '@/components/EventPublicationManager'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function EventPublication() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Event Publication', href: '/dashboard/event-publication' }
          ]}
          className="mb-4"
        />
        <EventPublicationManager />
      </div>
    </div>
  )
} 