import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      // This endpoint doesn't exist yet, we'll need to create it in the backend
      await api.post('/forgot-password', { email })
      setMessage(
        'If an account with that email exists, a password reset link has been sent.'
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email to receive a password reset link.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              {message && (
                <p className="text-green-600 text-sm text-center">{message}</p>
              )}
            </CardContent>

            <CardContent className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Button variant="ghost" asChild>
                <Link
                  to="/sign-in"
                  className="flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
