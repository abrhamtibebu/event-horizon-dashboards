import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Armchair, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { SeatingDesigner } from '@/features/seating/SeatingDesigner'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import {
  getEventSeating,
  publishSeatingChart,
  removeSeatingBackground,
  updateChartLayout,
  updateSeatingMode,
  uploadSeatingBackground,
} from '@/lib/api/seating'
import type { TicketType } from '@/types'

interface EventSeatingTabProps {
  eventId: number
}

export function EventSeatingTab({ eventId }: EventSeatingTabProps) {
  const queryClient = useQueryClient()
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['event-seating', eventId],
    queryFn: () => getEventSeating(eventId),
    enabled: !!eventId,
  })

  const { data: ticketTypes } = useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/ticket-types`)
      return (response.data ?? []) as TicketType[]
    },
    enabled: !!eventId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-seating', eventId] })
  }

  const modeMutation = useMutation({
    mutationFn: (reserved: boolean) =>
      updateSeatingMode(eventId, reserved ? 'reserved_seating' : 'general_admission'),
    onSuccess: () => {
      toast.success('Seating mode updated')
      invalidate()
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to update mode',
      )
    },
  })

  const publishMutation = useMutation({
    mutationFn: (is_published: boolean) => publishSeatingChart(eventId, is_published),
    onSuccess: (chart) => {
      toast.success(chart.is_published ? 'Seating chart published' : 'Seating chart unpublished')
      invalidate()
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Could not update publish state',
      )
    },
  })

  const layoutMutation = useMutation({
    mutationFn: (payload: { width?: number; height?: number }) =>
      updateChartLayout(eventId, payload),
    onSuccess: () => {
      toast.success('Canvas size saved')
      invalidate()
    },
    onError: () => toast.error('Failed to save canvas size'),
  })

  const backgroundMutation = useMutation({
    mutationFn: (file: File) => uploadSeatingBackground(eventId, file),
    onSuccess: () => {
      toast.success('Venue artwork uploaded')
      invalidate()
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.error ?? 'Failed to upload venue artwork'),
  })

  const removeBackgroundMutation = useMutation({
    mutationFn: () => removeSeatingBackground(eventId),
    onSuccess: () => {
      toast.success('Venue artwork removed')
      invalidate()
    },
    onError: () => toast.error('Failed to remove venue artwork'),
  })

  const isReserved = data?.seating_mode === 'reserved_seating'
  const chart = data?.chart

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading seating…" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Armchair className="h-5 w-5 text-primary" />
            Venue designer
          </CardTitle>
          <CardDescription>
            Lay out seating groups, tables and standing areas on your floor plan. What you build
            here is exactly what buyers see at checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={isReserved}
              onCheckedChange={(checked) => modeMutation.mutate(checked)}
              disabled={modeMutation.isPending}
            />
            <div>
              <p className="text-sm font-medium">
                {isReserved ? 'Reserved seating' : 'General admission'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isReserved
                  ? 'Buyers must pick seats before paying'
                  : 'Buyers only choose ticket quantities'}
              </p>
            </div>
          </div>
          {isReserved && chart && (
            <div className="flex items-center gap-2">
              <Button
                variant={chart.is_published ? 'outline' : 'default'}
                onClick={() => publishMutation.mutate(!chart.is_published)}
                disabled={publishMutation.isPending}
              >
                {chart.is_published ? 'Unpublish chart' : 'Publish chart'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {chart.is_published ? 'Live on checkout' : 'Draft — not shown to buyers'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {isReserved && chart && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Floor plan</CardTitle>
              <CardDescription>
                Set the canvas to your venue's proportions, and optionally trace a real plan by
                uploading it as artwork.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Canvas width</Label>
                  <Input
                    type="number"
                    defaultValue={chart.width ?? 1000}
                    onBlur={(e) => layoutMutation.mutate({ width: Number(e.target.value) || 1000 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Canvas height</Label>
                  <Input
                    type="number"
                    defaultValue={chart.height ?? 800}
                    onBlur={(e) => layoutMutation.mutate({ height: Number(e.target.value) || 800 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Venue artwork</Label>
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) backgroundMutation.mutate(file)
                      e.target.value = ''
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={backgroundMutation.isPending}
                      onClick={() => backgroundInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {chart.background_url ? 'Replace' : 'Upload SVG / image'}
                    </Button>
                    {chart.background_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove venue artwork"
                        disabled={removeBackgroundMutation.isPending}
                        onClick={() => removeBackgroundMutation.mutate()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {chart.background_url && (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <img
                    src={getImageUrl(chart.background_url)}
                    alt=""
                    className="h-16 w-24 rounded-md border border-border/60 bg-background object-contain"
                  />
                  <p className="text-xs text-muted-foreground">
                    Buyers see this artwork exactly as uploaded, with your elements drawn on top.
                    The canvas was matched to its size.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <SeatingDesigner
            eventId={eventId}
            chart={chart}
            ticketTypes={ticketTypes ?? []}
            onChartChanged={invalidate}
          />
        </>
      )}
    </div>
  )
}
