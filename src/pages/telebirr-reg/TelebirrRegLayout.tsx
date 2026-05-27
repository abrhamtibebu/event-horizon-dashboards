import type { ReactNode } from 'react'
import { TELEBIRR_ASSETS, TELEBIRR_COLORS } from './constants'

interface TelebirrRegLayoutProps {
  variant: 'register' | 'success'
  isOnsite?: boolean
  children: ReactNode
}

export function TelebirrRegLayout({ variant, isOnsite = false, children }: TelebirrRegLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10" style={{ colorScheme: 'light' }}>
      <nav
        className="bg-white border-b-4 shadow-md sticky top-0 z-50"
        style={{ borderColor: TELEBIRR_COLORS.deepGreen }}
      >
        <div className="max-w-7xl mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={TELEBIRR_ASSETS.ethioTelecomLogo}
              alt="Ethio Telecom"
              className="h-8 md:h-12 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:block text-right">
              {variant === 'register' ? (
                <>
                  <h1 className="text-xl font-bold text-gray-800">5th Year Anniversary</h1>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: TELEBIRR_COLORS.deepGreen }}
                  >
                    {isOnsite ? 'Onsite Exhibition Registration' : 'Exhibition Registration'}
                  </p>
                </>
              ) : (
                <h1 className="text-xl font-bold text-gray-800 text-center">Registration Confirmed</h1>
              )}
            </div>
            <div className="hidden md:block h-10 w-[2px] bg-gray-200" />
            <img
              src={TELEBIRR_ASSETS.telebirrLogo}
              alt="Telebirr"
              className="h-10 md:h-16 w-auto object-contain"
            />
          </div>
        </div>
      </nav>

      {children}
    </div>
  )
}

export function TelebirrRegFooter() {
  return (
    <div className="mt-12 flex flex-col items-center gap-4 text-gray-400">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Powered by</span>
        <a href="https://evella.et" target="_blank" rel="noopener noreferrer">
          <img src={TELEBIRR_ASSETS.evellaLogo} alt="Evella" className="h-6 transition-all cursor-pointer" />
        </a>
      </div>
      <p className="text-xs">© 2026 Ethio Telecom. All Rights Reserved.</p>
    </div>
  )
}
