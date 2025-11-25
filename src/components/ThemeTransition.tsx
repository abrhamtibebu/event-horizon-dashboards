import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { getThemeToggleClickPosition } from './ThemeToggle'

export function ThemeTransition() {
  const { theme, resolvedTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const previousTheme = useRef<string | undefined>(theme)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    // Check if theme actually changed
    if (previousTheme.current && theme !== previousTheme.current) {
      // Get position from ThemeToggle click
      const clickPosition = getThemeToggleClickPosition()
      // Use provided position or default to center
      const finalPosition = clickPosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      setPosition(finalPosition)
      setIsAnimating(true)

      // Add class to body for transition state
      document.body.classList.add('theme-transitioning')

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setPosition(null)
        document.body.classList.remove('theme-transitioning')
      }, 900) // Match animation duration

      return () => {
        clearTimeout(timer)
        document.body.classList.remove('theme-transitioning')
      }
    }

    previousTheme.current = theme
  }, [theme, resolvedTheme])

  if (!isAnimating || !position) return null

  const maxSize = Math.max(window.innerWidth, window.innerHeight) * 2.5
  const isDark = resolvedTheme === 'dark'

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Main circular ripple effect - expands from click position */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              background: isDark
                ? 'radial-gradient(circle, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.85) 30%, rgba(15, 23, 42, 0.6) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.85) 30%, rgba(255, 255, 255, 0.6) 50%, transparent 75%)',
              boxShadow: isDark
                ? '0 0 300px 150px rgba(15, 23, 42, 0.6), 0 0 500px 250px rgba(15, 23, 42, 0.3)'
                : '0 0 300px 150px rgba(255, 255, 255, 0.6), 0 0 500px 250px rgba(255, 255, 255, 0.3)',
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: maxSize,
              height: maxSize,
              opacity: [0, 1, 0.9, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.33, 1, 0.68, 1], // Custom easing for smooth expansion
            }}
          />
          
          {/* Secondary expanding circle with brand color accent */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(251, 179, 57, 0.2) 0%, rgba(251, 179, 57, 0.1) 25%, transparent 60%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: maxSize * 0.9,
              height: maxSize * 0.9,
              opacity: [0, 0.7, 0.4, 0],
            }}
            transition={{
              duration: 0.75,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.05,
            }}
          />

          {/* Tertiary circle for extra depth */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              background: isDark
                ? 'radial-gradient(circle, rgba(251, 179, 57, 0.08) 0%, transparent 40%)'
                : 'radial-gradient(circle, rgba(251, 179, 57, 0.05) 0%, transparent 40%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: maxSize * 0.7,
              height: maxSize * 0.7,
              opacity: [0, 0.5, 0.2, 0],
            }}
            transition={{
              duration: 0.65,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1,
            }}
          />

          {/* Overlay fade for smoother transition */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: isDark 
                ? 'radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.3) 100%)'
                : 'radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.3) 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.4, 0.2, 0],
            }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

