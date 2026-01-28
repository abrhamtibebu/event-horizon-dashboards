import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Shield, Image } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { getImageUrl } from '@/lib/utils'
import type { Event } from '../types/event.types'

interface EventDetailsHeaderProps {
  event: Event
  attendeeCount?: number
  organizerName?: string
}

export function EventDetailsHeader({ event, attendeeCount, organizerName }: EventDetailsHeaderProps) {
  return (
    <div className="relative w-full h-[300px] rounded-3xl overflow-hidden mb-8 shadow-lg border border-border">
      {event.event_image ? (
        <img
          src={getImageUrl(event.event_image)}
          alt={event.name}
          className="object-cover w-full h-full transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Image className="w-16 h-16 text-muted-foreground/20" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Event Info */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/dashboard/events"
            className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm hover:bg-background rounded-xl border border-border text-foreground text-xs font-semibold transition-all"
          >
            <span>←</span>
            Back
          </Link>
          <div className="px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-xl border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
            {event.event_type === 'ticketed' ? 'Ticketed' : 'Free Event'}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
          {event.name?.replace(/&amp;/g, '&')}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{event.start_date && format(parseISO(event.start_date), 'MMM d, h:mm a')}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="truncate max-w-[200px]">{event.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{attendeeCount ?? event.attendee_count ?? 0} Registered</span>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold">{organizerName || event.organizer?.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
