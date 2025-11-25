/**
 * TypeScript types for Custom Fields feature
 */

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'radio' | 'file'
export type VisibilityScope = 'registration' | 'internal' | 'both'

export interface FieldOption {
  label: string
  value: string
}

export interface CustomField {
  id?: number
  event_id: number
  field_label: string
  field_type: CustomFieldType
  field_key: string
  is_required: boolean
  options?: FieldOption[] // For select/radio/checkbox: [{label, value}]
  placeholder?: string
  help_text?: string
  validation_rules?: {
    min_length?: number
    max_length?: number
    min_value?: number
    max_value?: number
    pattern?: string
    allowed_file_types?: string[] // For file type
    max_file_size?: number // In bytes
  }
  order: number
  guest_type_ids: number[]
  visibility_scope: VisibilityScope
  version?: number
  is_archived?: boolean
  created_by?: number
  updated_by?: number
  conditional_rules?: { // Future: conditional logic
    depends_on_field_id?: number
    show_if_value?: string | string[]
  }
}

export interface CustomFieldResponse {
  id?: number
  attendee_id: number
  custom_field_id: number
  custom_field_version: number
  response_value: string
  response_file?: string
  file_download_url?: string // Signed URL for file access
  custom_field?: CustomField
}

export interface CustomFieldResponseFormData {
  field_id: number
  value?: string
  file?: File
}

export interface AttendeeCustomFieldResponses {
  attendee_id: number
  guest: {
    id: number
    name: string
    email: string
    phone?: string
  }
  guest_type?: string
  responses: CustomFieldResponse[]
}




