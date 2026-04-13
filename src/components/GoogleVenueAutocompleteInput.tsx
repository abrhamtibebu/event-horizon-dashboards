import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

declare global {
  interface Window {
    google?: any
  }
}

let googleMapsLoaderPromise: Promise<void> | null = null

function waitForGooglePlacesReady(timeoutMs = 10000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.google?.maps?.places) {
        resolve()
        return
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Google Maps Places library did not become ready in time'))
        return
      }
      setTimeout(check, 100)
    }
    check()
  })
}

function loadGoogleMapsPlaces(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) {
    return Promise.resolve()
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise
  }

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-places-script') as HTMLScriptElement | null
    if (existingScript) {
      if (window.google?.maps) {
        waitForGooglePlacesReady().then(resolve).catch(reject)
        return
      }
      existingScript.addEventListener('load', () => {
        waitForGooglePlacesReady().then(resolve).catch(reject)
      })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-places-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      waitForGooglePlacesReady().then(resolve).catch(reject)
    }
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })

  return googleMapsLoaderPromise
}

function extractCityFromPlace(place: any): string {
  const components: any[] = place?.address_components || []
  const cityComponent = components.find((c) => c.types?.includes('locality'))
  if (cityComponent?.long_name) return cityComponent.long_name

  const adminComponent = components.find((c) => c.types?.includes('administrative_area_level_1'))
  if (adminComponent?.long_name) return adminComponent.long_name

  return ''
}

interface PlaceSelection {
  venueName: string
  city: string
  formattedAddress: string
  latitude: number
  longitude: number
}

interface PlacePrediction {
  description: string
  place_id: string
}

interface GoogleVenueAutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelected: (selection: PlaceSelection) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export default function GoogleVenueAutocompleteInput({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  className,
  disabled,
  required,
}: GoogleVenueAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  const onPlaceSelectedRef = useRef(onPlaceSelected)
  const placesServiceRef = useRef<any>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const [autocompleteReady, setAutocompleteReady] = useState(false)
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    onChangeRef.current = onChange
    onPlaceSelectedRef.current = onPlaceSelected
  }, [onChange, onPlaceSelected])

  const canFetchPredictions = useMemo(() => {
    return autocompleteReady && !!value && value.trim().length >= 2
  }, [autocompleteReady, value])

  useEffect(() => {
    if (!apiKey || !inputRef.current) return

    const previousAuthFailureHandler = (window as any).gm_authFailure
    ;(window as any).gm_authFailure = () => {
      setGoogleError('Google Maps authentication failed. Please check API key restrictions.')
      if (typeof previousAuthFailureHandler === 'function') {
        previousAuthFailureHandler()
      }
    }

    loadGoogleMapsPlaces(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places) return

        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        const serviceContainer = document.createElement('div')
        placesServiceRef.current = new window.google.maps.places.PlacesService(serviceContainer)

        setAutocompleteReady(true)
      })
      .catch(() => {
        setGoogleError('Failed to load Google Maps services. Verify your API key and API enablement.')
        setAutocompleteReady(false)
      })

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      ;(window as any).gm_authFailure = previousAuthFailureHandler
    }
  }, [apiKey])

  useEffect(() => {
    if (!canFetchPredictions) {
      setSuggestions([])
      setHighlightedIndex(-1)
      setIsLoadingSuggestions(false)
      return
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    fetchTimeoutRef.current = setTimeout(() => {
      if (!autocompleteServiceRef.current) return

      setIsLoadingSuggestions(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value.trim(),
          types: ['geocode', 'establishment'],
        },
        (predictions: any[] | null, status: string) => {
          setIsLoadingSuggestions(false)
          if (status === 'REQUEST_DENIED') {
            setGoogleError('Google blocked autocomplete requests. Add your localhost URL to allowed HTTP referrers.')
            setSuggestions([])
            setHighlightedIndex(-1)
            return
          }
          if (status !== 'OK' || !Array.isArray(predictions)) {
            setSuggestions([])
            setHighlightedIndex(-1)
            return
          }

          const mapped: PlacePrediction[] = predictions.slice(0, 6).map((p) => ({
            description: p.description,
            place_id: p.place_id,
          }))
          setSuggestions(mapped)
          setHighlightedIndex(mapped.length > 0 ? 0 : -1)
          setIsOpen(true)
        }
      )
    }, 250)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [canFetchPredictions, value])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target) && inputRef.current && !inputRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSuggestionSelect = (prediction: PlacePrediction) => {
    if (!placesServiceRef.current || !window.google?.maps?.places) return

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      },
      (place: any, status: string) => {
        if (status !== 'OK' || !place) return

        const lat = place?.geometry?.location?.lat?.()
        const lng = place?.geometry?.location?.lng?.()
        if (typeof lat !== 'number' || typeof lng !== 'number') return

        const selection: PlaceSelection = {
          venueName: place?.name || prediction.description.split(',')[0] || value,
          city: extractCityFromPlace(place),
          formattedAddress: place?.formatted_address || prediction.description,
          latitude: lat,
          longitude: lng,
        }

        onChangeRef.current(selection.venueName)
        onPlaceSelectedRef.current(selection)
        setSuggestions([])
        setIsOpen(false)
      }
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true)
        }}
        onKeyDown={(e) => {
          if (!isOpen || suggestions.length === 0) return

          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const targetIndex = highlightedIndex >= 0 ? highlightedIndex : 0
            const picked = suggestions[targetIndex]
            if (picked) {
              handleSuggestionSelect(picked)
            }
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        required={required}
      />
      {isOpen && autocompleteReady && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg"
        >
          {suggestions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionSelect(prediction)}
              className={`w-full rounded-sm px-3 py-2 text-left text-sm ${
                index === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/70'
              }`}
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
      </div>
      {!apiKey && (
        <p className="text-xs text-muted-foreground">
          Add `VITE_GOOGLE_MAPS_API_KEY` in `.env` to enable Google venue autofill.
        </p>
      )}
      {googleError && (
        <p className="text-xs text-destructive">
          {googleError}
        </p>
      )}
      {apiKey && !autocompleteReady && (
        <p className="text-xs text-muted-foreground">
          Loading Google place suggestions...
        </p>
      )}
      {autocompleteReady && isLoadingSuggestions && (
        <p className="text-xs text-muted-foreground">
          Fetching matching locations...
        </p>
      )}
    </div>
  )
}
