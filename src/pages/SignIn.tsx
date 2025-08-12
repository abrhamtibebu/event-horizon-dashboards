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
import { useAuth } from '@/hooks/use-auth.tsx'
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
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your credentials.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glassy background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Enhanced glassy orbs with more blur */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-3xl backdrop-blur-sm"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/15 to-blue-400/15 rounded-full blur-3xl backdrop-blur-sm"></div>
        
        {/* Additional glassy elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl backdrop-blur-md"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl backdrop-blur-md"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/5 to-purple-300/5 rounded-full blur-3xl backdrop-blur-sm"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome Back To VEMS
          </h1>
            <p className="text-gray-600 text-lg font-medium"></p>
            <p className="text-gray-700 text-sm">Validity Event Management System</p>
          </div>
        </div>

        {/* Clean Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle glassy border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 p-[1px]">
            <div className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-xl"></div>
          </div>
          
          <div className="relative">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
              Sign In
            </CardTitle>
              </div>
            <CardDescription className="text-gray-600">
                Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                    <Mail className="w-4 h-4 text-blue-500" />
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
                    className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${
                      error ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

                {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                    <Lock className="w-4 h-4 text-purple-500" />
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
                      className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
                      error ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
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
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent' 
                          : 'border-gray-300'
                      }`}>
                        {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
          </div>
        </Card>

        {/* Clean Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <Link
              to="/privacy"
              className="hover:text-gray-700 transition-colors duration-200 hover:underline"
            >
              Privacy Policy
            </Link>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <Link
              to="/terms"
              className="hover:text-gray-700 transition-colors duration-200 hover:underline"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © 2025 VEMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
