import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface UpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  current?: number
  limit?: number | null
}

export function UpgradePrompt({
  open,
  onOpenChange,
  title,
  message,
  current,
  limit,
}: UpgradePromptProps) {
  const navigate = useNavigate()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
            {current !== undefined && limit !== null && (
              <div className="mt-2">
                <p className="text-sm">
                  Current usage: {current} / {limit}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => navigate('/dashboard/subscription/plans')}>
            View Plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

