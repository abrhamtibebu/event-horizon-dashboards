import { ReactNode, MouseEvent } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'

interface ProtectedButtonProps extends Omit<ButtonProps, 'onClick'> {
  permission?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  actionName?: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Protected button component - simplified to regular button
 * (Custom permission system has been removed)
 */
export function ProtectedButton({
  permission,
  onClick,
  actionName,
  children,
  fallback,
  ...buttonProps
}: ProtectedButtonProps) {
  // Just render a regular button now that permission system is removed
  // Users will rely on basic role-based access control
  return (
    <Button {...buttonProps} onClick={onClick}>
      {children}
    </Button>
  )
}
