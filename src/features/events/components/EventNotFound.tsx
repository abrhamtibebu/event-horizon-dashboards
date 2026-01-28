import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EventNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <XCircle className="w-12 h-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-foreground">Event Not Found</h3>
      <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
      <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
        Go Back
      </Button>
    </div>
  )
}
