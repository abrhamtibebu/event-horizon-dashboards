import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ForgotPassword() {
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
              Forgot Password
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Password reset assistance
            </p>
          </div>

          <div className="px-12 pb-8">
            <div className="flex items-start gap-4 p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/90">
                  Please contact your administrator for password reset assistance.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <a
                    href="mailto:info@validity.et"
                    className="text-primary hover:text-primary/80 hover:underline font-bold"
                  >
                    info@validity.et
                  </a>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="w-full h-14 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-base rounded-2xl border border-white/5 shadow-lg transition-all duration-300 active:scale-[0.98] group overflow-hidden relative"
            >
              <Link to="/signin" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Sign In</span>
              </Link>
            </Button>
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
