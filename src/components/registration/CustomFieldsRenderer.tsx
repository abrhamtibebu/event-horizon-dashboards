import { useState, useEffect } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CustomField, CustomFieldResponseFormData } from '@/types/customFields'

interface CustomFieldsRendererProps {
  fields: CustomField[]
  values: Record<number, CustomFieldResponseFormData>
  onChange: (fieldId: number, value: CustomFieldResponseFormData) => void
  errors?: Record<number, string>
}

export function CustomFieldsRenderer({
  fields,
  values,
  onChange,
  errors = {},
}: CustomFieldsRendererProps) {
  const [filePreviews, setFilePreviews] = useState<Record<number, string>>({})

  const handleFieldChange = (fieldId: number, value: string | File | boolean) => {
    const currentValue = values[fieldId] || { field_id: fieldId }
    
    if (value instanceof File) {
      onChange(fieldId, { ...currentValue, file: value })
      // Create preview for image files
      if (value.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreviews((prev) => ({
            ...prev,
            [fieldId]: e.target?.result as string,
          }))
        }
        reader.readAsDataURL(value)
      }
    } else if (typeof value === 'boolean') {
      onChange(fieldId, { ...currentValue, value: value ? 'true' : 'false' })
    } else {
      onChange(fieldId, { ...currentValue, value })
    }
  }

  const handleFileRemove = (fieldId: number) => {
    onChange(fieldId, { field_id: fieldId, value: '' })
    setFilePreviews((prev) => {
      const newPreviews = { ...prev }
      delete newPreviews[fieldId]
      return newPreviews
    })
  }

  const validateField = (field: CustomField, value: CustomFieldResponseFormData): string | null => {
    if (field.is_required) {
      if (field.field_type === 'file') {
        if (!value.file) {
          return `${field.field_label} is required`
        }
      } else {
        if (!value.value || value.value.trim() === '') {
          return `${field.field_label} is required`
        }
      }
    }

    if (value.value && field.validation_rules) {
      const rules = field.validation_rules
      
      if (rules.min_length && value.value.length < rules.min_length) {
        return `${field.field_label} must be at least ${rules.min_length} characters`
      }
      
      if (rules.max_length && value.value.length > rules.max_length) {
        return `${field.field_label} must be no more than ${rules.max_length} characters`
      }
      
      if (field.field_type === 'number') {
        const numValue = Number(value.value)
        if (isNaN(numValue)) {
          return `${field.field_label} must be a valid number`
        }
        if (rules.min_value !== undefined && numValue < rules.min_value) {
          return `${field.field_label} must be at least ${rules.min_value}`
        }
        if (rules.max_value !== undefined && numValue > rules.max_value) {
          return `${field.field_label} must be no more than ${rules.max_value}`
        }
      }
      
      if (field.field_type === 'email' && value.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value.value)) {
          return `${field.field_label} must be a valid email address`
        }
      }
      
      if (rules.pattern && value.value) {
        const regex = new RegExp(rules.pattern)
        if (!regex.test(value.value)) {
          return `${field.field_label} format is invalid`
        }
      }
    }

    if (value.file && field.field_type === 'file') {
      const allowedTypes = field.validation_rules?.allowed_file_types || ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
      const extension = value.file.name.split('.').pop()?.toLowerCase()
      
      if (!extension || !allowedTypes.includes(extension)) {
        return `File type must be one of: ${allowedTypes.join(', ')}`
      }
      
      const maxSize = field.validation_rules?.max_file_size || 5 * 1024 * 1024 // 5MB default
      if (value.file.size > maxSize) {
        return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      }
    }

    return null
  }

  const renderField = (field: CustomField) => {
    const fieldValue = values[field.id!] || { field_id: field.id! }
    const error = errors[field.id!]
    const fieldError = validateField(field, fieldValue)

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={`custom-field-${field.id}`}>
          {field.field_label}
          {field.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {field.help_text && (
          <p className="text-sm text-muted-foreground">{field.help_text}</p>
        )}

        {field.field_type === 'text' && (
          <Input
            id={`custom-field-${field.id}`}
            type="text"
            placeholder={field.placeholder}
            value={fieldValue.value || ''}
            onChange={(e) => handleFieldChange(field.id!, e.target.value)}
            className={error || fieldError ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'textarea' && (
          <Textarea
            id={`custom-field-${field.id}`}
            placeholder={field.placeholder}
            value={fieldValue.value || ''}
            onChange={(e) => handleFieldChange(field.id!, e.target.value)}
            className={error || fieldError ? 'border-destructive' : ''}
            rows={4}
          />
        )}

        {field.field_type === 'number' && (
          <Input
            id={`custom-field-${field.id}`}
            type="number"
            placeholder={field.placeholder}
            value={fieldValue.value || ''}
            onChange={(e) => handleFieldChange(field.id!, e.target.value)}
            className={error || fieldError ? 'border-destructive' : ''}
            min={field.validation_rules?.min_value}
            max={field.validation_rules?.max_value}
          />
        )}

        {field.field_type === 'email' && (
          <Input
            id={`custom-field-${field.id}`}
            type="email"
            placeholder={field.placeholder}
            value={fieldValue.value || ''}
            onChange={(e) => handleFieldChange(field.id!, e.target.value)}
            className={error || fieldError ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'phone' && (
          <Input
            id={`custom-field-${field.id}`}
            type="tel"
            placeholder={field.placeholder}
            value={fieldValue.value || ''}
            onChange={(e) => handleFieldChange(field.id!, e.target.value)}
            className={error || fieldError ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !fieldValue.value && 'text-muted-foreground',
                  error || fieldError ? 'border-destructive' : ''
                )}
              >
                {fieldValue.value ? format(new Date(fieldValue.value), 'PPP') : field.placeholder || 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fieldValue.value ? new Date(fieldValue.value) : undefined}
                onSelect={(date) =>
                  handleFieldChange(field.id!, date ? date.toISOString().split('T')[0] : '')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {field.field_type === 'select' && (
          <Select
            value={fieldValue.value || ''}
            onValueChange={(value) => handleFieldChange(field.id!, value)}
          >
            <SelectTrigger
              id={`custom-field-${field.id}`}
              className={error || fieldError ? 'border-destructive' : ''}
            >
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.field_type === 'radio' && (
          <RadioGroup
            value={fieldValue.value || ''}
            onValueChange={(value) => handleFieldChange(field.id!, value)}
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`} className="cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.field_type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => {
              const isChecked = fieldValue.value?.split(',').includes(option.value) || false
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = fieldValue.value?.split(',').filter(Boolean) || []
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value)
                      handleFieldChange(field.id!, newValues.join(','))
                    }}
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              )
            })}
          </div>
        )}

        {field.field_type === 'file' && (
          <div className="space-y-2">
            <Input
              id={`custom-field-${field.id}`}
              type="file"
              accept={field.validation_rules?.allowed_file_types
                ?.map((ext) => `.${ext}`)
                .join(',') || '.jpg,.jpeg,.png,.pdf,.doc,.docx'}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFieldChange(field.id!, file)
                }
              }}
              className={error || fieldError ? 'border-destructive' : ''}
            />
            {filePreviews[field.id!] && (
              <div className="relative inline-block">
                <img
                  src={filePreviews[field.id!]}
                  alt="Preview"
                  className="max-w-xs max-h-32 rounded border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  onClick={() => handleFileRemove(field.id!)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {fieldValue.file && !filePreviews[field.id!] && (
              <div className="flex items-center gap-2 text-sm">
                <span>{fieldValue.file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFileRemove(field.id!)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Allowed: {field.validation_rules?.allowed_file_types?.join(', ') || 'jpg, png, pdf, doc, docx'} 
              {' '}(Max: {Math.round((field.validation_rules?.max_file_size || 5 * 1024 * 1024) / 1024 / 1024)}MB)
            </p>
          </div>
        )}

        {(error || fieldError) && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || fieldError}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
        <p className="text-sm text-muted-foreground">
          Please provide the following information to complete your registration
        </p>
      </div>
      {fields.map(renderField)}
    </div>
  )
}




