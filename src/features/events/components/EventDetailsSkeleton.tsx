import { Spinner } from '@/components/ui/spinner'

export function EventDetailsSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Spinner size="lg" variant="primary" text="Loading event details..." />
    </div>
  )
}
