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
    <div className="max-w-full min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Event Location</h3>
        </div>
        <a
          href={openInMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-primary hover:underline min-h-11 inline-flex items-center sm:min-h-0 shrink-0"
        >
          Open in Maps
        </a>
      </div>

      <p className="mb-3 text-sm text-muted-foreground break-words">
        {venueName || location || 'Venue'}{formattedAddress ? ` - ${formattedAddress}` : ''}
      </p>

      <div className="overflow-hidden rounded-xl border border-border/70 max-w-full">
        <div className="relative w-full aspect-[4/3] min-h-[200px] max-h-[min(260px,45vh)] sm:max-h-[280px]">
          <iframe
            title="Event map location"
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 block h-full w-full max-w-full border-0"
          />
        </div>
      </div>
    </div>
  )
}
