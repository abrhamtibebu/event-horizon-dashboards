import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, CheckCircle, AlertCircle, ExternalLink, Zap } from 'lucide-react'
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

interface PlatformTestResults {
  publishedEvents: Event[]
  loading: boolean
  error: string | null
}

export default function PlatformIntegrationTest() {
  const [evellaResults, setEvellaResults] = useState<PlatformTestResults>({
    publishedEvents: [],
    loading: false,
    error: null
  })
  
  const [digisResults, setDigisResults] = useState<PlatformTestResults>({
    publishedEvents: [],
    loading: false,
    error: null
  })
  
  const { toast } = useToast()

  const testPlatformIntegration = async (platform: 'evella' | 'digis') => {
    const setResults = platform === 'evella' ? setEvellaResults : setDigisResults
    const platformName = platform === 'evella' ? 'Evella' : 'Digis'
    
    setResults(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Test the public API endpoint
      const response = await fetch('http://localhost:8000/api/public/events')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      setResults({
        publishedEvents: data.data || [],
        loading: false,
        error: null
      })
      
      toast({
        title: `✅ ${platformName} Integration Test Successful`,
        description: `Found ${data.data?.length || 0} published events on ${platformName} platform`,
      })
      
    } catch (error) {
      console.error(`${platformName} integration test failed:`, error)
      setResults({
        publishedEvents: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      toast({
        title: `❌ ${platformName} Integration Test Failed`,
        description: `Could not connect to ${platformName} platform. Check if the backend is running.`,
        variant: 'destructive',
      })
    }
  }

  const testAllPlatforms = async () => {
    await Promise.all([
      testPlatformIntegration('evella'),
      testPlatformIntegration('digis')
    ])
  }

  const openPlatform = (platform: 'evella' | 'digis') => {
    const url = platform === 'evella' ? 'http://localhost:3000' : 'http://localhost:5174'
    window.open(url, '_blank')
  }

  const renderPlatformTab = (
    platform: 'evella' | 'digis',
    results: PlatformTestResults,
    color: string,
    icon: React.ReactNode
  ) => {
    const platformName = platform === 'evella' ? 'Evella' : 'Digis'
    const platformUrl = platform === 'evella' ? 'localhost:3000' : 'localhost:5174'
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => testPlatformIntegration(platform)}
            disabled={results.loading}
            className={`${color} hover:opacity-90`}
          >
            {results.loading ? 'Testing...' : `Test ${platformName} Integration`}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => openPlatform(platform)}
            className={`border-${color.split('-')[1]}-300 text-${color.split('-')[1]}-700 hover:bg-${color.split('-')[1]}-50`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open {platformName} Platform
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p>Platform URL: <code className="bg-gray-100 px-2 py-1 rounded">{platformUrl}</code></p>
          <p>API Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">localhost:8000/api/public/events</code></p>
        </div>

        {results.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Integration Error</span>
            </div>
            <p className="text-red-700 text-sm">{results.error}</p>
            <div className="mt-3 text-xs text-red-600">
              <p>Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Ensure Laravel backend is running on port 8000</li>
                <li>Check if {platformName} frontend is running on the correct port</li>
                <li>Verify CORS settings in the backend</li>
                <li>Confirm at least one event has advertisement_status = 'approved'</li>
              </ul>
            </div>
          </div>
        )}

        {results.publishedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                {results.publishedEvents.length} Events Published on {platformName}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.publishedEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        by {event.organizer}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.date} • {event.location}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Live
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {results.publishedEvents.length > 4 && (
              <p className="text-sm text-gray-500 text-center">
                ... and {results.publishedEvents.length - 4} more events
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Platform Integration Test
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test connectivity to both Evella and Digis platforms to ensure published events are accessible.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test All Platforms Button */}
        <div className="flex justify-center">
          <Button 
            onClick={testAllPlatforms}
            disabled={evellaResults.loading || digisResults.loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Globe className="w-4 h-4 mr-2" />
            Test All Platforms
          </Button>
        </div>

        {/* Platform-specific Tabs */}
        <Tabs defaultValue="evella" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evella" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Evella Platform
            </TabsTrigger>
            <TabsTrigger value="digis" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Digis Platform
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="evella" className="mt-6">
            {renderPlatformTab(
              'evella',
              evellaResults,
              'bg-blue-600',
              <Globe className="w-4 h-4" />
            )}
          </TabsContent>
          
          <TabsContent value="digis" className="mt-6">
            {renderPlatformTab(
              'digis',
              digisResults,
              'bg-purple-600',
              <Zap className="w-4 h-4" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


