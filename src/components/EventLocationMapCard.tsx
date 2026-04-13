import { MapPin } from 'lucide-react'

interface EventLocationMapCardProps {
  latitude?: number | null
  longitude?: number | null
  venueName?: string | null
  location?: string | null
  formattedAddress?: string | null
}

export default function EventLocationMapCard({
  latitude,
  longitude,
  venueName,
  location,
  formattedAddress,
}: EventLocationMapCardProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number'
  const fallbackAddress = [venueName, formattedAddress, location].filter(Boolean).join(', ')
  const query = hasCoordinates ? `${latitude},${longitude}` : fallbackAddress

  if (!query) return null

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
  const openInMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Event Location</h3>
        </div>
        <a
          href={openInMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open in Maps
        </a>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {venueName || location || 'Venue'}{formattedAddress ? ` - ${formattedAddress}` : ''}
      </p>

      <div className="overflow-hidden rounded-xl border border-border/70">
        <iframe
          title="Event map location"
          src={embedSrc}
          width="100%"
          height="260"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block"
        />
      </div>
    </div>
  )
}
