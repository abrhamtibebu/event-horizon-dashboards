import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Save,
  Eye,
  Settings,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import FormFieldPalette from './FormFieldPalette';
import FormFieldEditor from './FormFieldEditor';
import FormPreview from './FormPreview';
import BadgeFieldMapper from './BadgeFieldMapper';

import { formApi, formFieldApi } from '@/lib/api/forms';
import type { Form, FormField, CreateFormFieldRequest, FormBuilderState } from '@/types/forms';

interface FormBuilderProps {
  formId: number;
  eventId: number;
  onSave?: () => void;
  onCancel?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  formId,
  eventId,
  onSave,
  onCancel
}) => {
  const [builderState, setBuilderState] = useState<FormBuilderState>({
    form: {},
    fields: [],
    selectedFieldId: undefined,
    isDirty: false,
    isPreviewMode: false,
    previewData: undefined
  });

  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [paletteCategory, setPaletteCategory] = useState('basic');
  const [errors, setErrors] = useState<string[]>([]);
  const [showBadgeMapper, setShowBadgeMapper] = useState(false);

  // Fetch form data
  const { data: formData, isLoading: formLoading, error: formError } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formApi.getForm(formId),
    enabled: !!formId,
    retry: 1
  });

  // Update builder state when form data loads
  useEffect(() => {
    if (formData) {
      setBuilderState(prev => ({
        ...prev,
        form: formData,
        fields: formData.formFields || []
      }));
    }
  }, [formData]);

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: (data: CreateFormFieldRequest) => formFieldApi.createField(formId, data),
    onSuccess: (newField) => {
      setBuilderState(prev => ({
        ...prev,
        fields: [...prev.fields, newField],
        isDirty: true
      }));
      setShowFieldEditor(false);
      setEditingField(null);
    },
    onError: (error: any) => {
      setErrors([error?.message || 'Failed to create field']);
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: CreateFormFieldRequest }) =>
      formFieldApi.updateField(formId, fieldId, data),
    onSuccess: (updatedField) => {
      setBuilderState(prev => ({
        ...prev,
        fields: prev.fields.map(f => f.id === updatedField.id ? updatedField : f),
        isDirty: true
      }));
      setShowFieldEditor(false);
      setEditingField(null);
    },
    onError: (error: any) => {
      setErrors([error?.message || 'Failed to update field']);
    }
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: number) => formFieldApi.deleteField(formId, fieldId),
    onSuccess: (_, fieldId) => {
      setBuilderState(prev => ({
        ...prev,
        fields: prev.fields.filter(f => f.id !== fieldId),
        selectedFieldId: prev.selectedFieldId === fieldId ? undefined : prev.selectedFieldId,
        isDirty: true
      }));
    },
    onError: (error: any) => {
      setErrors([error?.message || 'Failed to delete field']);
    }
  });

  // Reorder fields mutation
  const reorderFieldsMutation = useMutation({
    mutationFn: (fieldIds: number[]) => formFieldApi.reorderFields(formId, fieldIds),
    onSuccess: () => {
      // Refetch form data to get updated order
      // For now, just mark as dirty
      setBuilderState(prev => ({ ...prev, isDirty: true }));
    },
    onError: (error: any) => {
      setErrors([error?.message || 'Failed to reorder fields']);
    }
  });

  const handleFieldSelect = useCallback((fieldType: string) => {
    // Create a new field with basic data
    const newField: CreateFormFieldRequest = {
      field_type: fieldType as any,
      label: `New ${fieldType} field`,
      placeholder: '',
      is_required: false,
      default_value: null,
      validation_rules: {},
      conditional_logic: null,
      order: builderState.fields.length + 1,
      page_number: 1,
      options: []
    };

    setEditingField(null);
    setShowFieldEditor(true);
    // The editor will handle creating the field
  }, [builderState.fields.length]);

  const handleFieldEdit = useCallback((field: FormField) => {
    setEditingField(field);
    setShowFieldEditor(true);
  }, []);

  const handleFieldDelete = useCallback((fieldId: number) => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteFieldMutation.mutate(fieldId);
    }
  }, [deleteFieldMutation]);

  const handleFieldSave = useCallback((fieldData: CreateFormFieldRequest) => {
    if (editingField) {
      updateFieldMutation.mutate({ fieldId: editingField.id, data: fieldData });
    } else {
      createFieldMutation.mutate(fieldData);
    }
  }, [editingField, updateFieldMutation, createFieldMutation]);

  const handleFieldMove = useCallback((fieldId: number, direction: 'up' | 'down') => {
    const currentIndex = builderState.fields.findIndex(f => f.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= builderState.fields.length) return;

    const newFields = [...builderState.fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];

    // Update order values
    newFields.forEach((field, index) => {
      field.order = index + 1;
    });

    setBuilderState(prev => ({ ...prev, fields: newFields, isDirty: true }));

    // Save the new order
    const fieldIds = newFields.map(f => f.id);
    reorderFieldsMutation.mutate(fieldIds);
  }, [builderState.fields, reorderFieldsMutation]);

  const handleFieldDuplicate = useCallback((field: FormField) => {
    const duplicatedField: CreateFormFieldRequest = {
      field_type: field.field_type,
      label: `${field.label} (Copy)`,
      placeholder: field.placeholder,
      is_required: field.is_required,
      default_value: field.default_value,
      validation_rules: field.validation_rules,
      conditional_logic: field.conditional_logic,
      order: builderState.fields.length + 1,
      page_number: field.page_number,
      options: field.fieldOptions?.map(opt => ({
        label: opt.option_label,
        value: opt.option_value
      })) || []
    };

    createFieldMutation.mutate(duplicatedField);
  }, [builderState.fields.length, createFieldMutation]);

  const handleSaveForm = useCallback(() => {
    // Save the form (fields are already saved individually)
    setBuilderState(prev => ({ ...prev, isDirty: false }));
    onSave?.();
  }, [onSave]);

  const getFieldIcon = (fieldType: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      textarea: '📄',
      email: '✉️',
      phone: '📞',
      date: '📅',
      datetime: '🕐',
      select: '📋',
      radio: '🔘',
      checkbox: '☑️',
      number: '🔢',
      address: '📍',
      file: '📎',
      hidden: '👁️‍🗨️'
    };
    return icons[fieldType] || '📝';
  };

  if (formLoading) {
    return <div className="flex justify-center p-8">Loading form...</div>;
  }

  if (!formData) {
    return <div className="flex justify-center p-8">Form not found</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">{formData.name}</h2>
          <p className="text-sm text-muted-foreground">
            {builderState.fields.length} fields • {formData.guest_type?.name || formData.form_type || 'No guest type'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBuilderState(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode }))}
            disabled={showBadgeMapper}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBadgeMapper(!showBadgeMapper)}
          >
            🏷️ Badge Mapping
          </Button>
          <Button
            onClick={handleSaveForm}
            disabled={!builderState.isDirty}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Form
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Loading Error */}
      {formError && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Failed to load form</div>
            <div className="text-sm">
              {formError instanceof Error 
                ? formError.message 
                : (formError as any)?.response?.data?.message || (formError as any)?.message || 'Form not found'}
            </div>
            {(formError as any)?.response?.status === 404 && (
              <div className="text-sm mt-2">
                The form may have been deleted or you may not have permission to access it.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {formLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading form...</div>
            <div className="text-sm text-muted-foreground">Please wait</div>
          </div>
        </div>
      ) : formError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <div className="text-lg font-semibold mb-2">Unable to load form</div>
            <div className="text-sm text-muted-foreground mb-4">
              {formError instanceof Error 
                ? formError.message 
                : (formError as any)?.response?.data?.message || 'Form not found'}
            </div>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
            )}
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">
        {showBadgeMapper ? (
          <div className="flex-1 p-4 overflow-auto">
            <BadgeFieldMapper
              formId={formId}
              onClose={() => setShowBadgeMapper(false)}
            />
          </div>
        ) : builderState.isPreviewMode ? (
          <FormPreview
            formData={formData}
            fields={builderState.fields}
            onClose={() => setBuilderState(prev => ({ ...prev, isPreviewMode: false }))}
          />
        ) : (
          <>
            {/* Form Canvas */}
            <div className="flex-1 p-4 overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Form Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {builderState.fields.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-4xl mb-4">📋</div>
                      <p>No fields added yet</p>
                      <p className="text-sm">Drag fields from the palette to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {builderState.fields.map((field, index) => (
                        <Card
                          key={field.id}
                          className={`cursor-pointer transition-all ${
                            builderState.selectedFieldId === field.id
                              ? 'ring-2 ring-primary'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setBuilderState(prev => ({
                            ...prev,
                            selectedFieldId: field.id
                          }))}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <span className="text-lg">{getFieldIcon(field.field_type)}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{field.label}</h4>
                                    {field.is_required && (
                                      <Badge variant="destructive" className="text-xs">Required</Badge>
                                    )}
                                    {field.conditional_logic && (
                                      <Badge variant="secondary" className="text-xs">Conditional</Badge>
                                    )}
                                    {field.badgeMappings && field.badgeMappings.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        🏷️ {field.badgeMappings.length} mapped
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {field.field_type} • {field.placeholder || 'No placeholder'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldEdit(field);
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldDuplicate(field);
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldMove(field.id, 'up');
                                  }}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldMove(field.id, 'down');
                                  }}
                                  disabled={index === builderState.fields.length - 1}
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldDelete(field.id);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Field Editor Panel */}
            <div className="w-96 border-l bg-background">
              {showFieldEditor ? (
                <div className="p-4">
                  <FormFieldEditor
                    field={editingField}
                    onSave={handleFieldSave}
                    onCancel={() => {
                      setShowFieldEditor(false);
                      setEditingField(null);
                    }}
                    onDelete={editingField ? () => {
                      if (editingField) handleFieldDelete(editingField.id);
                    } : undefined}
                    availableFields={builderState.fields.filter(f => f.id !== editingField?.id)}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <FormFieldPalette
                    onFieldSelect={handleFieldSelect}
                    selectedCategory={paletteCategory}
                    onCategoryChange={setPaletteCategory}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};

export default FormBuilder;
