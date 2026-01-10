import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Globe, ExternalLink, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VennuTestResult {
  platform: string
  status: 'success' | 'error' | 'loading'
  message: string
  data?: any
  error?: string
}

export default function VennuIntegrationTest() {
  const [testResults, setTestResults] = useState<VennuTestResult[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [vennuApiUrl, setVennuApiUrl] = useState('http://localhost:3000')
  const { toast } = useToast()

  const testVennuIntegration = async () => {
    setIsTesting(true)
    setTestResults([])

    const tests = [
      {
        name: 'Vennu Frontend',
        url: `${vennuApiUrl}`,
        description: 'Testing Vennu frontend accessibility'
      },
      {
        name: 'Vennu API Integration',
        url: `${vennuApiUrl}/api/events`,
        description: 'Testing Vennu API endpoint'
      },
      {
        name: 'Evella Admin Backend Connection',
        url: 'https://api.validity.et/api/public/events',
        description: 'Testing Evella Admin backend public events endpoint'
      }
    ]

    const results: VennuTestResult[] = []

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
        title: '✅ All Tests Passed!',
        description: `Vennu integration is working perfectly. All ${totalCount} tests passed.`,
      })
    } else {
      toast({
        title: '⚠️ Some Tests Failed',
        description: `${successCount}/${totalCount} tests passed. Check the results below for details.`,
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
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
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-blue-600" />
          Vennu Platform Integration Test
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test connectivity to Vennu platform and manage event publication methods.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="vennu-url">Vennu Frontend URL</Label>
            <Input
              id="vennu-url"
              value={vennuApiUrl}
              onChange={(e) => setVennuApiUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={testVennuIntegration} 
            disabled={isTesting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Integration...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Vennu Integration
              </>
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Test Results</h4>
            
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

        {/* Quick Links */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(vennuApiUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Vennu Frontend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://api.validity.et/api/public/events', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Evella Public API
            </Button>
          </div>
        </div>

        {/* Integration Status */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Integration Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">Evella Backend</p>
                <p className="text-sm text-green-600">Events with approved status are automatically published</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-blue-800">Vennu Platform</p>
                <p className="text-sm text-blue-600">Fetches approved events from Evella backend</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



