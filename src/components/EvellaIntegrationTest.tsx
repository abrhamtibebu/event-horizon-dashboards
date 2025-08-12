import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
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

export default function EvellaIntegrationTest() {
  const [testResults, setTestResults] = useState<{
    publishedEvents: Event[]
    loading: boolean
    error: string | null
  }>({
    publishedEvents: [],
    loading: false,
    error: null
  })
  const { toast } = useToast()

  const testEvellaIntegration = async () => {
    setTestResults(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Test the public API endpoint
      const response = await fetch('http://localhost:8000/api/public/events')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      setTestResults({
        publishedEvents: data.data || [],
        loading: false,
        error: null
      })
      
      toast({
        title: '✅ Integration Test Successful',
        description: `Found ${data.data?.length || 0} published events on Evella platform`,
      })
      
    } catch (error) {
      console.error('Evella integration test failed:', error)
      setTestResults({
        publishedEvents: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      toast({
        title: '❌ Integration Test Failed',
        description: 'Could not connect to Evella platform. Check if the backend is running.',
        variant: 'destructive',
      })
    }
  }

  const openEvellaPlatform = () => {
    window.open('http://localhost:3000', '_blank')
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Evella Platform Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testEvellaIntegration}
            disabled={testResults.loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testResults.loading ? 'Testing...' : 'Test Integration'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={openEvellaPlatform}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Evella Platform
          </Button>
        </div>

        {testResults.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Integration Error</span>
            </div>
            <p className="text-red-700 text-sm">{testResults.error}</p>
          </div>
        )}

        {testResults.publishedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                {testResults.publishedEvents.length} Events Published on Evella
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testResults.publishedEvents.slice(0, 4).map((event) => (
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
          </div>
        )}
      </CardContent>
    </Card>
  )
} 