import { useEffect, useState } from 'react'
import { Building2, MapPin } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { venueApi, type Venue, type VenueSpace } from '@/lib/api/venues'

export interface ListedVenueSelection {
  mode: 'listed' | 'custom'
  venueId: number | null
  spaceId: number | null
  venueName: string
  city: string
  formattedAddress: string
  latitude: number | null
  longitude: number | null
}

interface Props {
  value: ListedVenueSelection
  onChange: (next: ListedVenueSelection) => void
  cities?: string[]
  required?: boolean
}

export default function ListedVenuePicker({ value, onChange, cities = [], required }: Props) {
  const [venues, setVenues] = useState<Venue[]>([])

  useEffect(() => {
    venueApi
      .catalog()
      .then((res) => setVenues(res.data.data || res.data || []))
      .catch(() => setVenues([]))
  }, [])

  const selected = venues.find((v) => v.id === value.venueId)
  const spaces: VenueSpace[] = selected?.spaces || []

  const applyListed = (venue: Venue, spaceId?: number | null) => {
    const space = spaceId
      ? venue.spaces?.find((s) => s.id === spaceId)
      : venue.spaces?.find((s) => s.is_default) || venue.spaces?.[0]
    onChange({
      mode: 'listed',
      venueId: venue.id,
      spaceId: space?.id ?? null,
      venueName: venue.name,
      city: venue.city || '',
      formattedAddress: venue.formatted_address || '',
      latitude: venue.latitude ?? null,
      longitude: venue.longitude ?? null,
    })
  }

  return (
    <div className="space-y-3">
      {venues.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Listed venue
          </Label>
          <Select
            value={value.venueId ? String(value.venueId) : 'custom'}
            onValueChange={(id) => {
              if (id === 'custom') {
                onChange({
                  ...value,
                  mode: 'custom',
                  venueId: null,
                  spaceId: null,
                })
                return
              }
              const venue = venues.find((v) => String(v.id) === id)
              if (venue) applyListed(venue)
            }}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Pick a venue on Evella, or enter your own" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Venue not on Evella — enter address</SelectItem>
              {venues.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.name}{v.city ? ` · ${v.city}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.mode === 'listed' && spaces.length > 1 && (
        <div className="space-y-2">
          <Label>Hall / space</Label>
          <Select
            value={value.spaceId ? String(value.spaceId) : ''}
            onValueChange={(id) => {
              if (selected) applyListed(selected, Number(id))
            }}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Select a space" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}{s.capacity ? ` (${s.capacity})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.mode !== 'listed' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-500" /> Venue
          </Label>
          <GoogleVenueAutocompleteInput
            value={value.venueName}
            onChange={(venueValue) =>
              onChange({
                ...value,
                mode: 'custom',
                venueId: null,
                spaceId: null,
                venueName: venueValue,
                latitude: null,
                longitude: null,
                formattedAddress: '',
              })
            }
            onPlaceSelected={(selection) =>
              onChange({
                mode: 'custom',
                venueId: null,
                spaceId: null,
                venueName: selection.venueName,
                city: selection.city && cities.includes(selection.city) ? selection.city : selection.city || value.city,
                formattedAddress: selection.formattedAddress,
                latitude: selection.latitude,
                longitude: selection.longitude,
              })
            }
            placeholder="Enter venue or pick from Google suggestions"
            className="h-12 border-border focus:border-green-500 focus:ring-green-500 rounded-xl"
            required={required && value.mode !== 'listed'}
          />
        </div>
      )}
    </div>
  )
}
