import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'

const AVAILABLE_FIELDS = [
  { 
    category: 'Attendee',
    fields: [
      { value: '{attendee.name}', label: 'Name' },
      { value: '{attendee.email}', label: 'Email' },
      { value: '{attendee.company}', label: 'Company' },
      { value: '{attendee.jobtitle}', label: 'Job Title' },
      { value: '{attendee.phone}', label: 'Phone' },
      { value: '{attendee.uuid}', label: 'UUID (for QR)' },
    ]
  },
  {
    category: 'Event',
    fields: [
      { value: '{event.name}', label: 'Event Name' },
      { value: '{event.date}', label: 'Event Date' },
      { value: '{event.location}', label: 'Location' },
    ]
  },
  {
    category: 'Guest Type',
    fields: [
      { value: '{guest_type.name}', label: 'Guest Type Name' },
    ]
  },
]

export function DynamicFieldPicker() {
  const { activeElementId, updateElement, elements } = useBadgeStore()
  const activeElement = elements.find(el => el.id === activeElementId)
  
  const handleInsertField = (field: string) => {
    if (!activeElementId) return
    
    if (activeElement?.type === 'text') {
      // For text elements, append to content
      const currentContent = activeElement.properties.content || ''
      updateElement(activeElementId, {
        properties: {
          content: currentContent + ' ' + field,
        },
      })
    } else if (activeElement?.type === 'qr') {
      // For QR codes, replace the data
      updateElement(activeElementId, {
        properties: {
          dynamicField: field,
          qrData: field,
        },
      })
    }
  }
  
  if (!activeElement || (activeElement.type !== 'text' && activeElement.type !== 'qr')) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a text or QR code element to insert dynamic fields
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-3">
      <div>
        <Label className="text-sm font-semibold">Insert Dynamic Field</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add placeholders that will be replaced with real data when printing badges
        </p>
      </div>
      
      {AVAILABLE_FIELDS.map((category) => (
        <div key={category.category} className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            {category.category}
          </h4>
          <div className="grid gap-1">
            {category.fields.map((field) => (
              <Button
                key={field.value}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => handleInsertField(field.value)}
              >
                {field.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


