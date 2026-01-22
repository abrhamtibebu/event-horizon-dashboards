import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Shield, AlertTriangle, CheckCircle, Scale } from 'lucide-react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function TermsOfService() {
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#0A0D14] overflow-hidden">
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

      <div className="relative z-10 w-full max-w-5xl h-[85vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#151921]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.56)] overflow-hidden h-full flex flex-col"
        >
          {/* Top Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 flex-shrink-0" />

          {/* Header */}
          <div className="flex-shrink-0 border-b border-white/5 bg-white/[0.02]">
            <div className="px-6 sm:px-10 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Terms of Service</h1>
                  <p className="text-sm text-gray-400">Rules and regulations for using our platform</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="hidden sm:flex border-white/10 hover:bg-white/5 hover:text-white text-gray-300 gap-2"
              >
                <Link to={returnUrl}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              </Button>
            </div>
          </div>

          {/* Content Scroll Area */}
          <ScrollArea className="flex-grow">
            <div className="px-6 sm:px-10 py-8">
              <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Last Updated */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-medium text-purple-200">
                    Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-400 prose-strong:text-white prose-li:text-gray-400 prose-a:text-primary hover:prose-a:text-primary/80">
                  <p className="text-lg leading-relaxed text-gray-300">
                    Welcome to Evella Admin (Validity Event Management System). These Terms of Service govern your use of our event management platform and services. By accessing or using our services, you agree to be bound by these terms.
                  </p>

                  <div className="grid gap-8 mt-12">
                    {/* Section 1 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">1</span>
                        <h2 className="text-xl font-bold m-0">Introduction</h2>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <p className="m-0">
                          These Terms of Service ("Terms") govern your use of Evella Admin ("Service"), operated by Validity Inc. ("Company", "we", "us", or "our"). By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy.
                        </p>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">2. Service Description</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                          <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-4">What We Provide</h3>
                          <ul className="space-y-2 m-0 list-none pl-0">
                            {[
                              'Event management platform',
                              'User registration system',
                              'Badge design tools',
                              'Analytics and reporting',
                              'Customer support'
                            ].map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm !text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6">
                          <h3 className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-4">Your Responsibilities</h3>
                          <ul className="space-y-2 m-0 list-none pl-0">
                            {[
                              'Provide accurate information',
                              'Maintain account security',
                              'Comply with applicable laws',
                              'Respect other users',
                              'Report violations'
                            ].map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm !text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-400 font-bold border border-green-500/20">3</span>
                        <h2 className="text-xl font-bold m-0">User Accounts</h2>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <p className="text-gray-400 mb-4">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
                        <ul className="grid sm:grid-cols-2 gap-4 list-none pl-0 m-0">
                          <li className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            To access the service, you must verify that you are at least 18 years old.
                          </li>
                          <li className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            Provide accurate, current, and complete information during registration.
                          </li>
                          <li className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            Maintain the security of your account credentials.
                          </li>
                          <li className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            Notify us immediately of any breach of security.
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 font-bold border border-yellow-500/20">4</span>
                        <h2 className="text-xl font-bold m-0">Prohibited Activities</h2>
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                          <div className="space-y-4">
                            <p className="text-yellow-200/80 m-0 text-sm">You agree not to engage in any of the following prohibited activities:</p>
                            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 list-none pl-0 m-0">
                              {[
                                'Violating any applicable laws',
                                'Infringing intellectual property',
                                'Harassing other users',
                                'Unauthorized access attempts',
                                'Interfering with operations',
                                'Sharing malicious content'
                              ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                  <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 10 - Contact */}
                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-8 text-center mt-8">
                      <h2 className="text-xl font-bold text-white mb-4 m-0">Have Questions?</h2>
                      <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                        If you have any questions about these Terms of Service, please contact our support team.
                      </p>
                      <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-primary font-bold uppercase tracking-wider text-xs">Email</span>
                          <span className="text-white font-medium">info@validity.et</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-primary font-bold uppercase tracking-wider text-xs">Phone</span>
                          <span className="text-white font-medium">+251 96 577 3898</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-primary font-bold uppercase tracking-wider text-xs">Address</span>
                          <span className="text-white font-medium">Addis Ababa, Ethiopia</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Mobile Footer Button */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02] sm:hidden">
            <Button asChild className="w-full bg-white/10 hover:bg-white/20 text-white">
              <Link to={returnUrl}>Back to Registration</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
