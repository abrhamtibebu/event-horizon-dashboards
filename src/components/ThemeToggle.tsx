import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Context or prop to pass click position to ThemeTransition
let themeToggleClickPosition: { x: number; y: number } | undefined = undefined

export function setThemeToggleClickPosition(position: { x: number; y: number }) {
  themeToggleClickPosition = position
}

export function getThemeToggleClickPosition() {
  return themeToggleClickPosition
}

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const toggleRef = useRef<HTMLDivElement>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if dark mode is active
  // Use resolvedTheme to handle system theme properly - it returns 'light' or 'dark' even when theme is 'system'
  // Always provide a boolean value to avoid controlled/uncontrolled warning
  const isDark = mounted ? resolvedTheme === 'dark' : false

  const handleToggle = useCallback((checked: boolean) => {
    // Get click position relative to viewport
    if (toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      setThemeToggleClickPosition({ x: centerX, y: centerY })
    }
    
    // Small delay to ensure position is set before theme changes
    requestAnimationFrame(() => {
      // When user toggles, set explicit theme (not 'system') so their preference is stored
      // This allows them to override the system preference
      setTheme(checked ? 'dark' : 'light')
    })
  }, [setTheme])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <Switch disabled checked={false} className="opacity-50" />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div ref={toggleRef} className="flex items-center gap-2.5 px-1">
      <Sun 
        className={cn(
          "h-4 w-4 transition-all duration-500 ease-out",
          !isDark ? "text-primary scale-110 rotate-0" : "text-muted-foreground scale-100 rotate-90"
        )} 
      />
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        className="transition-all duration-300 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
        aria-label="Toggle dark mode"
      />
      <Moon 
        className={cn(
          "h-4 w-4 transition-all duration-500 ease-out",
          isDark ? "text-primary scale-110 rotate-0" : "text-muted-foreground scale-100 -rotate-90"
        )} 
      />
    </div>
  )
}

