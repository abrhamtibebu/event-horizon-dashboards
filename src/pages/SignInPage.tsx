import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react'
import { SpinnerInline } from '@/components/ui/spinner'
import CloudflareTurnstileWidget from '@/components/CloudflareTurnstileWidget'
import { getTurnstileSiteKey } from '@/config/env'
import api from '@/lib/api'

export default function AuthPage() {
  const location = useLocation()
  const [mode, setMode] = useState<'signin' | 'signup'>(
    location.pathname === '/register' ? 'signup' : 'signin',
  )

  useEffect(() => {
    setMode(location.pathname === '/register' ? 'signup' : 'signin')
  }, [location.pathname])

  const isSignUp = mode === 'signup'

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="relative flex h-[580px] w-full max-w-[860px] overflow-hidden rounded-[32px] bg-card shadow-2xl">
        {/* ── Forms layer ── */}
        <div className="relative z-0 flex h-full w-full">
          {/* Sign-in form (left half) */}
          <div
            className={`absolute inset-y-0 left-0 flex w-1/2 flex-col items-center justify-center px-8 transition-all duration-700 ease-in-out sm:px-12 ${
              isSignUp ? '-translate-x-[20%] scale-90 opacity-0' : 'translate-x-0 scale-100 opacity-100'
            }`}
          >
            <SignInForm />
          </div>

          {/* Sign-up form (right half) */}
          <div
            className={`absolute inset-y-0 right-0 flex w-1/2 flex-col items-center justify-center overflow-y-auto px-8 transition-all duration-700 ease-in-out sm:px-12 ${
              isSignUp ? 'translate-x-0 scale-100 opacity-100' : 'translate-x-[20%] scale-90 opacity-0'
            }`}
          >
            <SignUpForm />
          </div>
        </div>

        {/* ── Sliding overlay panel ── */}
        <div
          className={`pointer-events-none absolute inset-y-0 z-10 w-1/2 transition-transform duration-700 ease-in-out ${
            isSignUp ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="pointer-events-auto flex h-full flex-col items-center justify-center bg-primary px-10 text-center text-primary-foreground"
            style={{ borderRadius: isSignUp ? '0 0 0 0' : '0 0 0 0' }}
          >
            <h2 className="text-[30px] font-bold leading-tight">
              {isSignUp ? 'Welcome Back!' : 'Hello, Friend!'}
            </h2>
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-primary-foreground/80">
              {isSignUp
                ? 'Sign in with your credentials to access the Evella dashboard'
                : 'Register with your personal details to use all of Evella\u2019s features'}
            </p>
            <button
              onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
              className="mt-7 flex h-11 items-center justify-center rounded-full border-2 border-primary-foreground px-10 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              {isSignUp ? 'SIGN IN' : 'SIGN UP'}
            </button>
          </div>
        </div>

        {/* Mobile-only: the overlay is hidden; show inline link instead via each form */}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Sign-In form (used inside the card)
   ───────────────────────────────────────────── */

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<{
    message: string
    remainingAttempts?: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const turnstileSiteKey = getTurnstileSiteKey()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (turnstileSiteKey && !turnstileToken) {
        setError({ message: 'Please complete the security challenge.' })
        return
      }
      await login(
        { email, password, ...(turnstileToken ? { cf_turnstile_response: turnstileToken } : {}) },
        rememberMe,
      )
      navigate('/dashboard')
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError({ message: 'Cannot connect to the server.' })
        return
      }
      if (err.response?.status === 422) {
        const d = err.response?.data
        const msgs = d?.errors ? (Object.values(d.errors).flat() as string[]).join(', ') : d?.message
        setError({ message: msgs || 'Validation failed.' })
      } else if (err.response?.status === 401) {
        const d = err.response?.data
        setError({ message: d?.error || d?.message || 'Invalid email or password.', remainingAttempts: d?.remaining_attempts })
      } else {
        setError({ message: err.response?.data?.message || err.message || 'Login failed.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await loginWithGoogle()
    } catch {
      setError({ message: 'Could not start Google sign-in.' })
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <img src="/evella-logo.png" alt="Evella" className="mb-2 h-11 w-11 object-contain" />
      <h1 className="text-2xl font-bold text-foreground">Sign In</h1>

      <div className="mt-4 flex items-center gap-3">
        <SocialButton onClick={handleGoogle} disabled={googleLoading || isLoading}>
          {googleLoading ? <SpinnerInline /> : <GoogleIcon />}
        </SocialButton>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">Or use your email password</p>

      <form onSubmit={handleSubmit} className="mt-3 w-full max-w-[320px] space-y-2.5">
        <PillInput icon="mail" type="email" placeholder="Email" required value={email} onChange={setEmail} disabled={isLoading} />
        <div className="relative">
          <PillInput icon="lock" type={showPassword ? 'text' : 'password'} placeholder="Password" required value={password} onChange={setPassword} disabled={isLoading} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-2.5 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-xs">{error.message}</p>
              {error.remainingAttempts !== undefined && <p className="mt-0.5 text-[10px] font-medium">Attempts left: {error.remainingAttempts}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px]">
          <label className="flex items-center gap-1.5 text-muted-foreground">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-border accent-primary" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-foreground hover:underline">Forgot Password?</Link>
        </div>

        {turnstileSiteKey && (
          <div className="rounded-xl bg-muted p-2">
            <CloudflareTurnstileWidget siteKey={turnstileSiteKey} onTokenChange={setTurnstileToken} />
          </div>
        )}

        <PillButton disabled={isLoading}>{isLoading ? <SpinnerInline /> : 'SIGN IN'}</PillButton>
      </form>

      <p className="mt-4 text-xs text-muted-foreground md:hidden">
        No account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">Sign Up</Link>
      </p>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary"
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
          <Shield className="h-3 w-3" /> Dev bypass
        </button>
      )}
    </>
  )
}

/* ─────────────────────────────────────────────
   Sign-Up form (used inside the card)
   ───────────────────────────────────────────── */

function SignUpForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleChange = (name: string, value: string) => {
    setFormData((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name) e.name = 'Required'
    if (!formData.email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email'
    if (!formData.password) e.password = 'Required'
    else if (formData.password.length < 6) e.password = 'Min 6 characters'
    if (!formData.confirmPassword) e.confirmPassword = 'Required'
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Mismatch'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      navigate('/signin')
    } catch { /* noop */ } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch {
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <img src="/evella-logo.png" alt="Evella" className="mb-2 h-11 w-11 object-contain" />
      <h1 className="text-2xl font-bold text-foreground">Create Account</h1>

      <div className="mt-4 flex items-center gap-3">
        <SocialButton onClick={handleGoogle} disabled={googleLoading || isLoading}>
          {googleLoading ? <SpinnerInline /> : <GoogleIcon />}
        </SocialButton>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">Or use your email for registration</p>

      <form onSubmit={handleSubmit} className="mt-3 w-full max-w-[320px] space-y-2.5">
        <PillInput icon="user" placeholder="Name" value={formData.name} onChange={(v) => handleChange('name', v)} disabled={isLoading} error={!!errors.name} />
        {errors.name && <ErrorText>{errors.name}</ErrorText>}

        <PillInput icon="mail" type="email" placeholder="Email" value={formData.email} onChange={(v) => handleChange('email', v)} disabled={isLoading} error={!!errors.email} />
        {errors.email && <ErrorText>{errors.email}</ErrorText>}

        <div className="relative">
          <PillInput icon="lock" type={showPw ? 'text' : 'password'} placeholder="Password" value={formData.password} onChange={(v) => handleChange('password', v)} disabled={isLoading} error={!!errors.password} />
          <TogglePw show={showPw} toggle={() => setShowPw(!showPw)} />
        </div>
        {errors.password && <ErrorText>{errors.password}</ErrorText>}

        <div className="relative">
          <PillInput icon="lock" type={showCpw ? 'text' : 'password'} placeholder="Confirm Password" value={formData.confirmPassword} onChange={(v) => handleChange('confirmPassword', v)} disabled={isLoading} error={!!errors.confirmPassword} />
          <TogglePw show={showCpw} toggle={() => setShowCpw(!showCpw)} />
        </div>
        {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}

        <PillButton disabled={isLoading}>{isLoading ? <SpinnerInline /> : 'SIGN UP'}</PillButton>
      </form>

      <p className="mt-4 text-xs text-muted-foreground md:hidden">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-primary hover:underline">Sign In</Link>
      </p>
    </>
  )
}

/* ─────────────────────────────────────────────
   Shared primitives (dark-mode aware)
   ───────────────────────────────────────────── */

const iconPaths: Record<string, JSX.Element> = {
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
}

function PillInput({
  icon,
  type = 'text',
  placeholder,
  required,
  value,
  onChange,
  disabled,
  error,
}: {
  icon: keyof typeof iconPaths
  type?: string
  placeholder: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  error?: boolean
}) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {iconPaths[icon]}
      </svg>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`h-11 w-full rounded-full border-0 bg-muted pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 ${error ? 'ring-2 ring-destructive/60' : ''}`}
      />
    </div>
  )
}

function PillButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function SocialButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:bg-muted disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function TogglePw({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="pl-4 text-[11px] text-destructive">{children}</p>
}

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
