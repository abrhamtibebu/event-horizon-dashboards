import { ReactNode, MouseEvent } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { PermissionGuard } from './PermissionGuard'

interface ProtectedButtonProps extends Omit<ButtonProps, 'onClick'> {
  permission: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  actionName?: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Button component that checks permissions before allowing click
 * Shows toast notification if user doesn't have permission
 */
export function ProtectedButton({
  permission,
  onClick,
  actionName,
  children,
  fallback,
  ...buttonProps
}: ProtectedButtonProps) {
  const { checkPermission } = usePermissionCheck()

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (checkPermission(permission, actionName)) {
      onClick?.(e)
    }
  }

  return (
    <PermissionGuard
      permission={permission}
      showToast={true}
      actionName={actionName}
      fallback={fallback}
    >
      <Button {...buttonProps} onClick={handleClick}>
        {children}
      </Button>
    </PermissionGuard>
  )
}

