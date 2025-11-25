import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { SpinnerInline } from '@/components/ui/spinner'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login({ email, password }, rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('[SignIn] Login error details:', err)
      console.error('[SignIn] Error response:', err.response?.data)
      console.error('[SignIn] Error status:', err.response?.status)
      console.error('[SignIn] Request payload:', { email, password: password ? '***' : 'empty' })
      console.error('[SignIn] Full error object:', JSON.stringify(err.response?.data, null, 2))
      
      // Handle network errors (backend not reachable)
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot connect to the server. Please make sure the backend is running on http://localhost:8000')
        return
      }
      
      // Handle validation errors (422)
      if (err.response?.status === 422) {
        const responseData = err.response?.data
        const errors = responseData?.errors
        
        if (errors) {
          // Format validation errors
          const errorMessages = Object.values(errors).flat() as string[]
          setError(errorMessages.join(', ') || 'Please check your input fields.')
        } else if (responseData?.message) {
          setError(responseData.message)
        } else {
          setError('Validation failed. Please check your input.')
        }
      } else if (err.response?.status === 401) {
        // Invalid credentials
        setError(err.response?.data?.error || err.response?.data?.message || 'Invalid email or password.')
      } else {
        // Other errors
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error ||
                           err.message ||
                           'Login failed. Please check your credentials and try again.'
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glassy background elements - Dark mode compatible */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Enhanced glassy orbs with more blur */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-info/10 dark:from-primary/20 dark:to-info/20 rounded-full blur-3xl backdrop-blur-sm"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-info/10 to-primary/10 dark:from-info/20 dark:to-primary/20 rounded-full blur-3xl backdrop-blur-sm"></div>
        
        {/* Additional glassy elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl backdrop-blur-md"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/5 dark:bg-white/3 rounded-full blur-2xl backdrop-blur-md"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-primary/5 to-info/5 dark:from-primary/10 dark:to-info/10 rounded-full blur-3xl backdrop-blur-sm"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Clean Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img 
              src="/Validity_logo.png" 
              alt="VEMS Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome Back To VEMS
          </h1>
            <p className="text-muted-foreground text-lg font-medium"></p>
            <p className="text-muted-foreground text-sm">Validity Event Management System</p>
          </div>
        </div>

        {/* Clean Card */}
        <Card className="shadow-2xl border bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="relative">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-card-foreground">
              Sign In
            </CardTitle>
              </div>
            <CardDescription className="text-muted-foreground">
                Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                    className="text-sm font-semibold text-foreground flex items-center gap-2"
                >
                    <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                      placeholder="Enter your email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-info/20 ${
                      error ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

                {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                    className="text-sm font-semibold text-foreground flex items-center gap-2"
                >
                    <Lock className="w-4 h-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                      className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      error ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

                {/* Error Message */}
              {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
              )}

                {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative">
                  <input
                    type="checkbox"
                        className="sr-only"
                    disabled={isLoading}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                      <div className={`w-4 h-4 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                        rememberMe 
                          ? 'bg-brand-gradient border-transparent' 
                          : 'border-border'
                      }`}>
                        {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                    className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                  className="w-full bg-brand-gradient text-foreground font-semibold py-2.5 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <SpinnerInline />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
              
              {/* Development Mode Button */}
              {import.meta.env.DEV && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-border text-muted-foreground hover:border-border hover:text-foreground"
                  onClick={() => {
                    // Clear any logout flags and enable mock mode
                    sessionStorage.removeItem('just_logged_out')
                    localStorage.setItem('mock_auth', 'true')
                    localStorage.setItem('jwt', 'dev-token')
                    localStorage.setItem('user_role', 'organizer')
                    localStorage.setItem('user_id', '6')
                    localStorage.setItem('organizer_id', '1')
                    window.location.href = '/dashboard'
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Enter Development Mode
                </Button>
              )}
            </CardFooter>
          </form>
          </div>
        </Card>

        {/* Clean Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors duration-200 hover:underline"
            >
              Privacy Policy
            </Link>
            <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors duration-200 hover:underline"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/60">
            © 2025 VEMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
