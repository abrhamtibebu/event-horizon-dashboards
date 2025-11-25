import { useState, useEffect } from 'react'
import { Download, FileText, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCustomFieldResponses, getCustomFieldFileUrl } from '@/lib/customFieldsApi'
import type { CustomFieldResponse } from '@/types/customFields'
import { SpinnerInline } from '@/components/ui/spinner'

interface ResponseViewerProps {
  attendeeId: number
  eventId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResponseViewer({ attendeeId, eventId, open, onOpenChange }: ResponseViewerProps) {
  const [responses, setResponses] = useState<CustomFieldResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && attendeeId) {
      fetchResponses()
    }
  }, [open, attendeeId])

  const fetchResponses = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomFieldResponses(eventId, attendeeId)
      setResponses(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load responses')
      console.error('Error fetching custom field responses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (fileId: string) => {
    try {
      const url = await getCustomFieldFileUrl(fileId)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error downloading file:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Field Responses</DialogTitle>
          <DialogDescription>
            View all custom field responses for this attendee
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <SpinnerInline />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : responses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No custom field responses found
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <div
                key={response.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    {response.custom_field?.field_label || 'Unknown Field'}
                  </h4>
                  <Badge variant="outline">
                    {response.custom_field?.field_type || 'text'}
                  </Badge>
                </div>
                {response.custom_field?.help_text && (
                  <p className="text-sm text-muted-foreground">
                    {response.custom_field.help_text}
                  </p>
                )}
                <div className="mt-2">
                  {response.custom_field?.field_type === 'file' ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{response.response_file || 'No file uploaded'}</span>
                      {response.response_file && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(response.response_file!)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground">
                      {response.response_value || <span className="text-muted-foreground">No response</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}




