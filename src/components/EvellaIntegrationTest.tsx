import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Globe, CheckCircle, AlertCircle, ExternalLink, Loader2, RefreshCw, Users, Calendar, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Event {
  id: number
  uuid: string
  title: string
  description: string
  image: string
  date: string
  time: string
  location: string
  organizer: string
  category: string
  attendees: number
  max_guests: number
}

interface EvellaTestResult {
  platform: string
  status: 'success' | 'error' | 'loading'
  message: string
  data?: any
  error?: string
}

export default function EvellaIntegrationTest() {
  const [testResults, setTestResults] = useState<EvellaTestResult[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [evellaApiUrl, setEvellaApiUrl] = useState('http://localhost:5174')
  const [publishedEvents, setPublishedEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const { toast } = useToast()

  const testEvellaIntegration = async () => {
    setIsTesting(true)
    setTestResults([])

    const tests = [
      {
        name: 'Evella Frontend',
        url: `${evellaApiUrl}`,
        description: 'Testing Evella frontend accessibility'
      },
      {
        name: 'Evella API Integration',
        url: `${evellaApiUrl}/api/events`,
        description: 'Testing Evella API endpoint'
      },
      {
        name: 'VEMS Backend Connection',
        url: 'https://api.validity.et/api/public/events',
        description: 'Testing VEMS backend public events endpoint'
      }
    ]

    const results: EvellaTestResult[] = []

    for (const test of tests) {
      // Add loading state
      results.push({
        platform: test.name,
        status: 'loading',
        message: `Testing ${test.description}...`
      })
      setTestResults([...results])

      try {
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          results[results.length - 1] = {
            platform: test.name,
            status: 'success',
            message: `${test.description} - Success!`,
            data: data
          }
        } else {
          results[results.length - 1] = {
            platform: test.name,
            status: 'error',
            message: `${test.description} - Failed with status ${response.status}`,
            error: `HTTP ${response.status}: ${response.statusText}`
          }
        }
      } catch (error) {
        results[results.length - 1] = {
          platform: test.name,
          status: 'error',
          message: `${test.description} - Connection failed`,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      setTestResults([...results])
    }

    setIsTesting(false)

    // Show summary toast
    const successCount = results.filter(r => r.status === 'success').length
    const totalCount = results.length

    if (successCount === totalCount) {
      toast({
        title: '✅ Evella Integration Successful!',
        description: `All ${totalCount} tests passed. Evella platform is ready for event publication.`,
      })
    } else {
      toast({
        title: '⚠️ Some Tests Failed',
        description: `${successCount}/${totalCount} tests passed. Check the results below for details.`,
        variant: 'destructive',
      })
    }
  }

  const fetchPublishedEvents = async () => {
    setLoadingEvents(true)
    try {
      const response = await fetch('https://api.validity.et/api/public/events')
      if (response.ok) {
        const data = await response.json()
        setPublishedEvents(data.data || [])
        toast({
          title: '✅ Events Fetched Successfully',
          description: `Found ${data.data?.length || 0} published events on Evella platform`,
        })
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch published events:', error)
      toast({
        title: '❌ Failed to Fetch Events',
        description: 'Could not retrieve published events from Evella platform.',
        variant: 'destructive',
      })
    } finally {
      setLoadingEvents(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <RefreshCw className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      loading: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    return (
      <Badge className={`${config[status as keyof typeof config]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-emerald-600" />
          Evella Platform Integration Test
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test connectivity to Evella platform and manage event publication methods.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="evella-url">Evella Frontend URL</Label>
            <Input
              id="evella-url"
              value={evellaApiUrl}
              onChange={(e) => setEvellaApiUrl(e.target.value)}
              placeholder="http://localhost:5174"
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testEvellaIntegration} 
              disabled={isTesting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Integration...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Evella Integration
                </>
              )}
            </Button>
            
            <Button 
              onClick={fetchPublishedEvents}
              disabled={loadingEvents}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {loadingEvents ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Integration Test Results</h4>
            
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h5 className="font-medium text-gray-900">{result.platform}</h5>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                
                {result.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 font-medium">Error:</p>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                )}
                
                {result.data && result.status === 'success' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">Response Data:</p>
                    <pre className="text-xs text-green-600 mt-1 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Published Events */}
        {publishedEvents.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Published Events on Evella</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {publishedEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 line-clamp-1 mb-1">
                        {event.title}
                      </h5>
                      <p className="text-sm text-gray-600 mb-2">
                        by {event.organizer}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                      Live on Evella
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{event.category}</span>
                    <span>{event.attendees} / {event.max_guests} attendees</span>
                  </div>
                </div>
              ))}
            </div>
            
            {publishedEvents.length > 6 && (
              <p className="text-sm text-gray-500 text-center">
                ... and {publishedEvents.length - 6} more events published on Evella
              </p>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(evellaApiUrl, '_blank')}
              className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <ExternalLink className="w-4 h-4" />
              Open Evella Frontend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://api.validity.et/api/public/events', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              VEMS Public API
            </Button>
          </div>
        </div>

        {/* Publication Methods */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Evella Publication Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-800">Automatic Publication</p>
                <p className="text-sm text-emerald-600">Events with approved status are automatically published to Evella</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-blue-800">Real-time Sync</p>
                <p className="text-sm text-blue-600">Evella fetches approved events from VEMS backend in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 