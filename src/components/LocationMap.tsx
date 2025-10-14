import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface LocationMapProps {
  latitude: number | null
  longitude: number | null
  formattedAddress: string
  venueName: string
  onLocationChange: (data: {
    latitude: number
    longitude: number
    formattedAddress: string
    venueName: string
  }) => void
}

declare global {
  interface Window {
    google: any
  }
}

export function LocationMap({
  latitude,
  longitude,
  formattedAddress,
  venueName,
  onLocationChange
}: LocationMapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [geocoder, setGeocoder] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setIsMapLoaded(true)
        return
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.warn('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.')
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setIsMapLoaded(true)
      script.onerror = () => {
        console.error('Failed to load Google Maps API')
        setIsMapLoaded(false)
      }
      
      // Handle Google Maps billing errors
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('BillingNotEnabledMapError')) {
          console.error('Google Maps API billing is not enabled. Please enable billing in your Google Cloud Console.')
          setIsMapLoaded(false)
        }
      })
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return

    const defaultCenter = latitude && longitude 
      ? { lat: latitude, lng: longitude }
      : { lat: 9.145, lng: 40.4897 } // Ethiopia center

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    const geocoderInstance = new window.google.maps.Geocoder()
    setGeocoder(geocoderInstance)
    setMap(mapInstance)

    // Add initial marker if coordinates exist
    if (latitude && longitude) {
      const markerInstance = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance,
        draggable: true,
        title: venueName || 'Event Location'
      })

      markerInstance.addListener('dragend', () => {
        const position = markerInstance.getPosition()
        reverseGeocode(position.lat(), position.lng())
      })

      setMarker(markerInstance)
    }

    // Add click listener to map
    mapInstance.addListener('click', (event: any) => {
      const position = event.latLng
      addMarker(position.lat(), position.lng())
      reverseGeocode(position.lat(), position.lng())
    })
  }, [isMapLoaded, latitude, longitude])

  const addMarker = (lat: number, lng: number) => {
    if (marker) {
      marker.setMap(null)
    }

    const markerInstance = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      draggable: true,
      title: 'Event Location'
    })

    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition()
      reverseGeocode(position.lat(), position.lng())
    })

    setMarker(markerInstance)
  }

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoder) return

    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const result = results[0]
        const formattedAddress = result.formatted_address
        
        // Extract venue name from address components
        let venueName = ''
        for (const component of result.address_components) {
          if (component.types.includes('establishment') || 
              component.types.includes('point_of_interest')) {
            venueName = component.long_name
            break
          }
        }

        onLocationChange({
          latitude: lat,
          longitude: lng,
          formattedAddress,
          venueName: venueName || formattedAddress.split(',')[0]
        })
      }
    })
  }

  const handleSearch = () => {
    if (!geocoder || !searchQuery.trim()) return

    geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const result = results[0]
        const position = result.geometry.location
        const lat = position.lat()
        const lng = position.lng()

        map.setCenter(position)
        map.setZoom(15)
        addMarker(lat, lng)
        reverseGeocode(lat, lng)
      }
    })
  }

  const clearLocation = () => {
    if (marker) {
      marker.setMap(null)
      setMarker(null)
    }
    onLocationChange({
      latitude: 0,
      longitude: 0,
      formattedAddress: '',
      venueName: ''
    })
  }

  if (!isMapLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                  <p className="text-xs text-gray-500 mt-2">If this takes too long, check your Google Maps API billing</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 mx-auto mb-4 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Google Maps API key not configured</p>
                  <p className="text-sm text-gray-500 mt-2">Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-semibold">Event Location</Label>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>

          {/* Map */}
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-lg border border-gray-200"
          />

          {/* Location Details */}
          {(latitude && longitude) && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Venue Name</p>
                  <p className="text-sm text-gray-600">{venueName}</p>
                </div>
                <Button
                  onClick={clearLocation}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{formattedAddress}</p>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Lat: {latitude.toFixed(6)}</span>
                <span>Lng: {longitude.toFixed(6)}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">How to set location:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Search for a location using the search bar above</li>
              <li>Click anywhere on the map to set the exact location</li>
              <li>Drag the marker to adjust the position</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
