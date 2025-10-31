import type { BadgeElement, SampleData } from '@/types/badge-designer/badge'

export function replaceDynamicFields(
  text: string | undefined,
  data: SampleData
): string {
  if (!text) return ''
  
  return text.replace(/\{(\w+)\.(\w+)\}/g, (match, entity, field) => {
    const value = (data as any)[entity]?.[field]
    return value !== undefined ? String(value) : match
  })
}

export function getAllDynamicFields(elements: BadgeElement[]): string[] {
  const fields = new Set<string>()
  elements.forEach(el => {
    const content = el.properties.content || el.properties.dynamicField
    if (content) {
      const matches = content.match(/\{(\w+)\.(\w+)\}/g)
      matches?.forEach(m => fields.add(m))
    }
  })
  return Array.from(fields)
}

export const AVAILABLE_FIELDS = [
  { value: '{attendee.name}', label: 'Attendee Name' },
  { value: '{attendee.email}', label: 'Email' },
  { value: '{attendee.company}', label: 'Company' },
  { value: '{attendee.jobtitle}', label: 'Job Title' },
  { value: '{attendee.phone}', label: 'Phone' },
  { value: '{attendee.uuid}', label: 'UUID (for QR)' },
  { value: '{event.name}', label: 'Event Name' },
  { value: '{event.date}', label: 'Event Date' },
  { value: '{event.location}', label: 'Event Location' },
  { value: '{guest_type.name}', label: 'Guest Type' },
]


