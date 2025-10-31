// Animation utility classes and functions for messaging components

export const fadeIn = 'animate-in fade-in duration-200'
export const fadeOut = 'animate-out fade-out duration-200'
export const slideIn = 'animate-in slide-in-from-right duration-300'
export const slideOut = 'animate-out slide-out-to-right duration-300'
export const scaleIn = 'animate-in zoom-in-95 duration-200'
export const scaleOut = 'animate-out zoom-out-95 duration-200'

// Stagger animation for list items
export const staggerDelay = (index: number, baseDelay = 50) => {
  return {
    animationDelay: `${index * baseDelay}ms`
  }
}

// Smooth scroll to element
export const smoothScrollTo = (element: HTMLElement, offset = 0) => {
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
  const offsetPosition = elementPosition - offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })
}

// Pulse animation for notifications
export const pulseAnimation = 'animate-pulse'

// Bounce animation for new items
export const bounceIn = 'animate-in zoom-in-95 duration-500'

// Shimmer effect for loading states
export const shimmer = 'animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:400%_100%]'

