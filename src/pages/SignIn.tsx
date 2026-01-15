import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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
import { motion } from 'framer-motion'
import { Turnstile } from '@marsidev/react-turnstile'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<{
    message: string;
    remainingAttempts?: number;
    warning?: string;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!captchaToken) {
      setError({ message: 'Please complete the captcha verification.' })
      setIsLoading(false)
      return
    }

    try {
      await login({ email, password, captchaToken }, rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('[SignIn] Login error details:', err)

      // Handle network errors (backend not reachable)
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError({ message: 'Cannot connect to the server. Please make sure the backend is running on http://localhost:8000' })
        return
      }

      // Handle validation errors (422)
      if (err.response?.status === 422) {
        const responseData = err.response?.data
        const errors = responseData?.errors

        if (errors) {
          const errorMessages = Object.values(errors).flat() as string[]
          setError({ message: errorMessages.join(', ') || 'Please check your input fields.' })
        } else if (responseData?.message) {
          setError({ message: responseData.message })
        } else {
          setError({ message: 'Validation failed. Please check your input.' })
        }
      } else if (err.response?.status === 401) {
        // Invalid credentials with potential remaining attempts
        const data = err.response?.data;
        setError({
          message: data?.error || data?.message || 'Invalid email or password.',
          remainingAttempts: data?.remaining_attempts,
          warning: data?.warning
        })
      } else {
        // Other errors
        const errorMessage = err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Login failed. Please check your credentials and try again.'
        setError({ message: errorMessage })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background transition-colors duration-500">
      {/* Dynamic Background with Animated Brand Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[20%] right-[0%] w-[600px] h-[600px] bg-info/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute -bottom-[20%] left-[20%] w-[700px] h-[700px] bg-warning/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-border/50 bg-gradient-to-b from-card to-transparent">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center mb-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-info/30 blur-xl rounded-full" />
              <img
                src="/evella-logo.png"
                alt="Evella Admin Logo"
                className="w-16 h-16 object-contain relative z-10 drop-shadow-md"
              />
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to manage your events
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground/60 pl-10 h-11 focus-visible:ring-ring focus-visible:border-ring transition-all rounded-xl"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground/60 pl-10 pr-10 h-11 focus-visible:ring-ring focus-visible:border-ring transition-all rounded-xl"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3 items-start"
                >
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-destructive font-medium leading-tight">{error.message}</p>
                    {error.remainingAttempts !== undefined && (
                      <p className="text-xs text-destructive/80">
                        Remaining attempts: <span className="font-bold">{error.remainingAttempts}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="h-4 w-4 rounded border border-input bg-background peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center cursor-pointer">
                    <CheckCircle className={`w-3 h-3 text-primary-foreground ${rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all`} />
                  </div>
                  <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none">
                    Remember for 30 days
                  </label>
                </div>
              </div>

              {/* Turnstile Captcha */}
              <div className="flex justify-center w-full overflow-hidden">
                <Turnstile
                  siteKey="0x4AAAAAACModrHHLD3RUANr"
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setError({ message: 'Captcha error. Please try again.' })}
                  options={{
                    theme: 'auto',
                  }}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-gradient text-white font-semibold py-6 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <SpinnerInline className="text-white" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Dev Mode Shortcut */}
            {import.meta.env.DEV && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 pt-6 border-t border-border/50"
              >
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 uppercase tracking-wider"
                  onClick={() => {
                    sessionStorage.removeItem('just_logged_out')
                    localStorage.setItem('mock_auth', 'true')
                    localStorage.setItem('jwt', 'dev-token')
                    localStorage.setItem('user_role', 'organizer')
                    localStorage.setItem('user_id', '6')
                    localStorage.setItem('organizer_id', '1')
                    window.location.href = '/dashboard'
                  }}
                >
                  <Shield className="w-3 h-3 mr-2" />
                  Enter Development Mode
                </Button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-muted/30 p-4 text-center text-xs text-muted-foreground backdrop-blur-md">
            <p>Protected by reCAPTCHA and subject to the Privacy Policy and Terms of Service.</p>
          </div>
        </motion.div>

        {/* Links */}
        <div className="mt-8 text-center flex justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}
