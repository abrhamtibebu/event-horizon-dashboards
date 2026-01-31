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
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ email, password }, rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('[SignIn] Login error details:', err)

      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError({ message: 'Cannot connect to the server. Please check your connection and that the API URL is set correctly in .env (VITE_API_URL).' })
        return
      }

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
        const data = err.response?.data;
        setError({
          message: data?.error || data?.message || 'Invalid email or password.',
          remainingAttempts: data?.remaining_attempts,
          warning: data?.warning
        })
      } else {
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-x-hidden bg-[#0A0D14] py-12">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            x: [0, -80, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 60, 0],
            y: [0, 80, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute -bottom-[10%] left-[15%] w-[550px] h-[550px] bg-primary/15 rounded-full blur-[100px]"
        />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-[550px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#151921]/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.56)] overflow-hidden"
        >
          {/* Top Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          {/* Header Section */}
          <div className="pt-8 pb-4 px-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              className="inline-flex items-center justify-center mb-4 relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
              <div className="relative p-2">
                <img
                  src="/evella-logo.png"
                  alt="Evella Admin Logo"
                  className="w-14 h-14 object-contain filter drop-shadow-[0_0_8px_rgba(255,111,60,0.5)]"
                />
              </div>
            </motion.div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Manage your event with style.
            </p>
          </div>

          <div className="px-12 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 ml-1">
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
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 pl-11 h-12 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all rounded-xl hover:bg-white/[0.05]"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 ml-1">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary hover:text-primary/80 transition-all"
                  >
                    Reset?
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
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 pl-11 pr-11 h-12 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all rounded-xl hover:bg-white/[0.05]"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[13px] text-red-200 font-medium leading-relaxed">{error.message}</p>
                    {error.remainingAttempts !== undefined && (
                      <p className="text-[11px] text-red-400 font-bold uppercase tracking-wider">
                        Attempts remaining: {error.remainingAttempts}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="h-5 w-5 rounded-md border-2 border-white/10 bg-white/5 peer-checked:bg-primary peer-checked:border-primary transition-all duration-300" />
                    <CheckCircle className={`absolute w-3.5 h-3.5 text-white ${rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all duration-300`} />
                  </div>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-2xl shadow-[0_10px_30px_-10px_rgba(255,111,60,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 group overflow-hidden relative"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <SpinnerInline className="text-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}

                {/* Subtle button glare effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </form>

            {/* Dev Mode Shortcut */}
            {import.meta.env.DEV && (
              <div className="mt-8">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl border border-white/5 bg-white/[0.02] text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
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
                  <Shield className="w-3.5 h-3.5" />
                  Developer Bypass
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-10 flex justify-center gap-8"
        >
          <Link to="/privacy" className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-white transition-colors">Terms</Link>
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-600">© 2026 Evella</span>
        </motion.div>
      </div>
    </div>
  )
}
