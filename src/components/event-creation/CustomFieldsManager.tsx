import { useState } from 'react'
import { Plus, Trash2, GripVertical, Edit2, X, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CustomField, FieldOption, CustomFieldType, VisibilityScope } from '@/types/customFields'

interface CustomFieldsManagerProps {
  fields: CustomField[]
  onChange: (fields: CustomField[]) => void
  guestTypes?: Array<{ id: number; name: string }>
  maxFields?: number
}

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select/Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'file', label: 'File Upload' },
]

const VISIBILITY_SCOPES: { value: VisibilityScope; label: string }[] = [
  { value: 'registration', label: 'Registration Only' },
  { value: 'internal', label: 'Internal Only' },
  { value: 'both', label: 'Both' },
]

const MAX_FIELDS = 30

function SortableFieldItem({
  field,
  index,
  onEdit,
  onDelete,
  guestTypes,
}: {
  field: CustomField
  index: number
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  guestTypes?: Array<{ id: number; name: string }>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.field_key || `field-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const visibleGuestTypes = field.guest_type_ids?.length
    ? guestTypes?.filter((gt) => field.guest_type_ids?.includes(gt.id)).map((gt) => gt.name).join(', ')
    : 'All Guest Types'

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{field.field_label || 'Untitled Field'}</span>
                <Badge variant="outline">{field.field_type}</Badge>
                {field.is_required && <Badge variant="destructive">Required</Badge>}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Key: {field.field_key}</div>
                {field.placeholder && <div>Placeholder: {field.placeholder}</div>}
                <div>Visibility: {field.visibility_scope}</div>
                <div>Visible to: {visibleGuestTypes}</div>
                {field.options && field.options.length > 0 && (
                  <div>Options: {field.options.length} items</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(index)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CustomFieldsManager({
  fields,
  onChange,
  guestTypes = [],
  maxFields = MAX_FIELDS,
}: CustomFieldsManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<CustomField | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(
        (f) => (f.field_key || `field-${fields.indexOf(f)}`) === active.id
      )
      const newIndex = fields.findIndex(
        (f) => (f.field_key || `field-${fields.indexOf(f)}`) === over.id
      )

      const newFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        order: index + 1,
      }))

      onChange(newFields)
    }
  }

  const handleAddField = () => {
    if (fields.length >= maxFields) {
      return
    }

    const newField: CustomField = {
      event_id: 0, // Will be set when saving event
      field_label: '',
      field_type: 'text',
      field_key: '',
      is_required: false,
      order: fields.length + 1,
      guest_type_ids: [],
      visibility_scope: 'registration',
    }

    setEditingField(newField)
    setEditingIndex(fields.length)
  }

  const handleEditField = (index: number) => {
    setEditingField({ ...fields[index] })
    setEditingIndex(index)
  }

  const handleSaveField = () => {
    if (!editingField) return

    // Generate field_key if not provided
    if (!editingField.field_key && editingField.field_label) {
      const key = editingField.field_label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      editingField.field_key = key
    }

    // Validate options for select/radio/checkbox
    if (['select', 'radio', 'checkbox'].includes(editingField.field_type)) {
      if (!editingField.options || editingField.options.length === 0) {
        alert('Please add at least one option for select, radio, or checkbox fields')
        return
      }
    }

    const newFields = [...fields]
    if (editingIndex !== null && editingIndex < fields.length) {
      newFields[editingIndex] = editingField
    } else {
      newFields.push(editingField)
    }

    onChange(newFields)
    setEditingField(null)
    setEditingIndex(null)
  }

  const handleDeleteField = (index: number) => {
    if (confirm('Are you sure you want to delete this field?')) {
      const newFields = fields.filter((_, i) => i !== index).map((field, i) => ({
        ...field,
        order: i + 1,
      }))
      onChange(newFields)
    }
  }

  const handleAddOption = () => {
    if (!editingField) return
    const newOptions = [...(editingField.options || []), { label: '', value: '' }]
    setEditingField({ ...editingField, options: newOptions })
  }

  const handleUpdateOption = (index: number, field: 'label' | 'value', value: string) => {
    if (!editingField || !editingField.options) return
    const newOptions = [...editingField.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setEditingField({ ...editingField, options: newOptions })
  }

  const handleRemoveOption = (index: number) => {
    if (!editingField || !editingField.options) return
    const newOptions = editingField.options.filter((_, i) => i !== index)
    setEditingField({ ...editingField, options: newOptions })
  }

  const handleToggleGuestType = (guestTypeId: number) => {
    if (!editingField) return
    const currentIds = editingField.guest_type_ids || []
    const newIds = currentIds.includes(guestTypeId)
      ? currentIds.filter((id) => id !== guestTypeId)
      : [...currentIds, guestTypeId]
    setEditingField({ ...editingField, guest_type_ids: newIds })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Add custom questions for guests to answer during registration
          </p>
        </div>
        <Button
          onClick={handleAddField}
          disabled={fields.length >= maxFields}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {fields.length >= maxFields && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Maximum {maxFields} custom fields allowed per event.
          </AlertDescription>
        </Alert>
      )}

      {fields.length === 0 && !editingField && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No custom fields added yet. Click "Add Field" to get started.
          </CardContent>
        </Card>
      )}

      {fields.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f, i) => f.field_key || `field-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.field_key || `field-${index}`}
                  field={field}
                  index={index}
                  onEdit={handleEditField}
                  onDelete={handleDeleteField}
                  guestTypes={guestTypes}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingField && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingIndex !== null && editingIndex < fields.length
                  ? 'Edit Field'
                  : 'Add Field'}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingField(null)
                  setEditingIndex(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_label">
                  Field Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="field_label"
                  value={editingField.field_label}
                  onChange={(e) =>
                    setEditingField({ ...editingField, field_label: e.target.value })
                  }
                  placeholder="e.g., Dietary Requirements"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_type">
                  Field Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editingField.field_type}
                  onValueChange={(value: CustomFieldType) =>
                    setEditingField({ ...editingField, field_type: value })
                  }
                >
                  <SelectTrigger id="field_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_key">Field Key (auto-generated if empty)</Label>
              <Input
                id="field_key"
                value={editingField.field_key}
                onChange={(e) =>
                  setEditingField({ ...editingField, field_key: e.target.value })
                }
                placeholder="dietary_requirements"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={editingField.placeholder || ''}
                onChange={(e) =>
                  setEditingField({ ...editingField, placeholder: e.target.value })
                }
                placeholder="Enter your dietary requirements..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                value={editingField.help_text || ''}
                onChange={(e) =>
                  setEditingField({ ...editingField, help_text: e.target.value })
                }
                placeholder="Additional information to help users fill this field..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_required"
                checked={editingField.is_required}
                onCheckedChange={(checked) =>
                  setEditingField({ ...editingField, is_required: !!checked })
                }
              />
              <Label htmlFor="is_required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility_scope">Visibility Scope</Label>
              <Select
                value={editingField.visibility_scope}
                onValueChange={(value: VisibilityScope) =>
                  setEditingField({ ...editingField, visibility_scope: value })
                }
              >
                <SelectTrigger id="visibility_scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_SCOPES.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {guestTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Visible to Guest Types</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {guestTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No guest types available. Create guest types first.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="all_guest_types"
                          checked={
                            !editingField.guest_type_ids ||
                            editingField.guest_type_ids.length === 0 ||
                            editingField.guest_type_ids.length === guestTypes.length
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditingField({ ...editingField, guest_type_ids: [] })
                            } else {
                              setEditingField({
                                ...editingField,
                                guest_type_ids: guestTypes.map((gt) => gt.id),
                              })
                            }
                          }}
                        />
                        <Label htmlFor="all_guest_types" className="cursor-pointer font-medium">
                          All Guest Types
                        </Label>
                      </div>
                      <div className="space-y-1 pl-6">
                        {guestTypes.map((gt) => (
                          <div key={gt.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`guest_type_${gt.id}`}
                              checked={
                                !editingField.guest_type_ids ||
                                editingField.guest_type_ids.length === 0 ||
                                editingField.guest_type_ids.includes(gt.id)
                              }
                              onCheckedChange={() => handleToggleGuestType(gt.id)}
                            />
                            <Label
                              htmlFor={`guest_type_${gt.id}`}
                              className="cursor-pointer text-sm"
                            >
                              {gt.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {['select', 'radio', 'checkbox'].includes(editingField.field_type) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2 border rounded-lg p-3">
                  {editingField.options && editingField.options.length > 0 ? (
                    editingField.options.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) =>
                            handleUpdateOption(index, 'label', e.target.value)
                          }
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) =>
                            handleUpdateOption(index, 'value', e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No options added. Click "Add Option" to add options.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingField(null)
                  setEditingIndex(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveField} disabled={!editingField.field_label}>
                <Save className="w-4 h-4 mr-2" />
                Save Field
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




