import { XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EventDetailsErrorProps {
  error: string
  onRetry?: () => void
}

export function EventDetailsError({ error, onRetry }: EventDetailsErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <XCircle className="w-12 h-12 text-error" />
      <h3 className="text-lg font-semibold text-foreground">Failed to Load Event</h3>
      <p className="text-muted-foreground text-center">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}
