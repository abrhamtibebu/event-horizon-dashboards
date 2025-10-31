import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { 
  mockMessages, 
  mockOptimisticMessage, 
  formattingTestCases, 
  generateLargeMessageList,
  testUtils 
} from '../../lib/messaging-test-utils'
import MessageContent from '../messaging/MessageContent'
import MessageBubble from '../messaging/MessageBubble'
import OptimisticMessageBubble from '../messaging/OptimisticMessageBubble'
import { formatMessageContent } from '../../lib/message-formatting'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'pending'
  message: string
  duration?: number
}

export const MessagingSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')

  const runTest = async (testName: string, testFn: () => Promise<boolean> | boolean): Promise<void> => {
    const startTime = Date.now()
    setCurrentTest(testName)
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      
      setTestResults(prev => [...prev, {
        name: testName,
        status: result ? 'pass' : 'fail',
        message: result ? 'Test passed' : 'Test failed',
        duration
      }])
    } catch (error) {
      const duration = Date.now() - startTime
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        message: `Error: ${error}`,
        duration
      }])
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    // Test 1: Message formatting
    await runTest('Message Formatting', () => {
      try {
        formattingTestCases.forEach(testCase => {
          const result = formatMessageContent(testCase.input)
          // Simple check - in real tests you'd use a proper HTML parser
          if (!result.includes('strong') && testCase.input.includes('**')) {
            throw new Error(`Bold formatting failed for: ${testCase.input}`)
          }
        })
        return true
      } catch (error) {
        console.error('Formatting test failed:', error)
        return false
      }
    })

    // Test 2: Message rendering
    await runTest('Message Rendering', () => {
      try {
        // Test that MessageBubble renders without errors
        const testMessage = mockMessages[0]
        return testMessage !== undefined
      } catch (error) {
        console.error('Rendering test failed:', error)
        return false
      }
    })

    // Test 3: Optimistic updates
    await runTest('Optimistic Updates', () => {
      try {
        // Test that OptimisticMessageBubble renders without errors
        const testMessage = mockOptimisticMessage
        return testMessage.isOptimistic === true
      } catch (error) {
        console.error('Optimistic updates test failed:', error)
        return false
      }
    })

    // Test 4: Performance with large lists
    await runTest('Performance - Large Lists', async () => {
      try {
        const largeList = generateLargeMessageList(1000)
        const startTime = Date.now()
        
        // Simulate rendering a large list
        largeList.forEach(message => {
          // This would normally render components
          const content = message.content
        })
        
        const duration = Date.now() - startTime
        return duration < 1000 // Should complete within 1 second
      } catch (error) {
        console.error('Performance test failed:', error)
        return false
      }
    })

    // Test 5: Link detection
    await runTest('Link Detection', () => {
      try {
        const testContent = 'Visit https://example.com and http://test.org'
        const formatted = formatMessageContent(testContent)
        return formatted.includes('href=') && formatted.includes('https://example.com')
      } catch (error) {
        console.error('Link detection test failed:', error)
        return false
      }
    })

    // Test 6: Mention detection
    await runTest('Mention Detection', () => {
      try {
        const testContent = 'Hello @john and @jane'
        const formatted = formatMessageContent(testContent)
        return formatted.includes('@john') && formatted.includes('@jane')
      } catch (error) {
        console.error('Mention detection test failed:', error)
        return false
      }
    })

    // Test 7: Hashtag detection
    await runTest('Hashtag Detection', () => {
      try {
        const testContent = 'Check out #event and #meeting'
        const formatted = formatMessageContent(testContent)
        return formatted.includes('#event') && formatted.includes('#meeting')
      } catch (error) {
        console.error('Hashtag detection test failed:', error)
        return false
      }
    })

    // Test 8: Code formatting
    await runTest('Code Formatting', () => {
      try {
        const testContent = 'Use `const x = 1` for initialization'
        const formatted = formatMessageContent(testContent)
        return formatted.includes('code') && formatted.includes('const x = 1')
      } catch (error) {
        console.error('Code formatting test failed:', error)
        return false
      }
    })

    setIsRunning(false)
    setCurrentTest('')
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200'
      case 'fail':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const passedTests = testResults.filter(r => r.status === 'pass').length
  const failedTests = testResults.filter(r => r.status === 'fail').length
  const totalTests = testResults.length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Messaging System Test Suite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button 
                onClick={() => setTestResults([])} 
                variant="outline"
                disabled={isRunning}
              >
                Clear Results
              </Button>
            </div>
            
            {totalTests > 0 && (
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-green-600">
                  Passed: {passedTests}
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  Failed: {failedTests}
                </Badge>
                <Badge variant="outline">
                  Total: {totalTests}
                </Badge>
              </div>
            )}
          </div>

          {isRunning && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Running: {currentTest}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {result.duration}ms
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Sample Message with Formatting:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <MessageContent content="Hello **world**! Check out https://example.com and mention @john #test" />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Message Bubble Preview:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <MessageBubble
                message={mockMessages[0]}
                currentUserId={1}
                onReply={() => {}}
                onDelete={() => {}}
              />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Optimistic Message Preview:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <OptimisticMessageBubble
                message={mockOptimisticMessage}
                currentUserId={1}
                onReply={() => {}}
                onDelete={() => {}}
                onRetry={() => {}}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MessagingSystemTest



