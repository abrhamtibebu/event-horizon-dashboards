import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Plus,
  Trash2,
  Zap,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { formApi, formFieldApi } from '@/lib/api/forms';
import type { FormField, BadgeFieldMapping, BadgeMappingSuggestion } from '@/types/forms';

interface BadgeFieldMapperProps {
  formId: number;
  onClose?: () => void;
}

export const BadgeFieldMapper: React.FC<BadgeFieldMapperProps> = ({
  formId,
  onClose
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const queryClient = useQueryClient();

  // Fetch form data with fields
  const { data: formData, isLoading: fieldsLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formApi.getForm(formId),
  });

  const fields = formData?.formFields || [];

  // Get available placeholders for selected field
  const {
    data: placeholderData,
    isLoading: placeholdersLoading
  } = useQuery({
    queryKey: ['field-placeholders', formId, selectedFieldId],
    queryFn: () => selectedFieldId ? formFieldApi.getAvailablePlaceholders(formId, selectedFieldId) : null,
    enabled: !!selectedFieldId,
  });

  // Create mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: ({ fieldId, placeholder, fieldType }: {
      fieldId: number;
      placeholder: string;
      fieldType: string;
    }) => formFieldApi.createBadgeMapping(formId, fieldId, {
      badge_placeholder: placeholder,
      field_type: fieldType
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', formId] });
    },
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: ({ fieldId, mappingId }: { fieldId: number; mappingId: number }) =>
      formFieldApi.deleteBadgeMapping(formId, fieldId, mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', formId] });
    },
  });

  // Auto-suggest mappings
  const suggestMappingsMutation = useMutation({
    mutationFn: async () => {
      if (!fields) return [];

      const suggestions: Array<{
        fieldId: number;
        placeholder: string;
        fieldType: string;
      }> = [];

      for (const field of fields) {
        const { data } = await formFieldApi.getAvailablePlaceholders(formId, field.id);
        if (data.suggestions && data.suggestions.length > 0) {
          suggestions.push({
            fieldId: field.id,
            placeholder: data.suggestions[0].placeholder,
            fieldType: field.field_type
          });
        }
      }

      return suggestions;
    },
    onSuccess: (suggestions) => {
      // Auto-create suggested mappings
      suggestions.forEach(suggestion => {
        createMappingMutation.mutate(suggestion);
      });
    },
  });

  const handleCreateMapping = (fieldId: number, placeholder: string) => {
    const field = fields?.find(f => f.id === fieldId);
    if (field) {
      createMappingMutation.mutate({
        fieldId,
        placeholder,
        fieldType: field.field_type
      });
    }
  };

  const handleDeleteMapping = (fieldId: number, mappingId: number) => {
    deleteMappingMutation.mutate({ fieldId, mappingId });
  };

  const handleAutoSuggest = () => {
    suggestMappingsMutation.mutate();
  };

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

  const getPlaceholderIcon = (placeholder: string) => {
    const iconMap: Record<string, string> = {
      name: '👤',
      first_name: '👤',
      last_name: '👤',
      email: '✉️',
      phone: '📞',
      company: '🏢',
      job_title: '💼',
      department: '📂',
      country: '🌍',
      city: '🏙️',
      guest_type: '🎫',
      badge_id: '🆔',
      registration_date: '📅',
      event_name: '🎪',
      event_date: '📅',
      event_location: '📍'
    };

    // Extract placeholder name (remove {{ }})
    const cleanPlaceholder = placeholder.replace(/[{}]/g, '');
    return iconMap[cleanPlaceholder] || '🏷️';
  };

  const getMappedPlaceholders = (field: FormField) => {
    return field.badgeMappings?.map(mapping => mapping.badge_placeholder) || [];
  };

  const isPlaceholderMapped = (placeholder: string) => {
    return fields?.some(field =>
      field.badgeMappings?.some(mapping => mapping.badge_placeholder === placeholder)
    ) || false;
  };

  const getFieldForPlaceholder = (placeholder: string) => {
    return fields?.find(field =>
      field.badgeMappings?.some(mapping => mapping.badge_placeholder === placeholder)
    );
  };

  if (fieldsLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading form fields...</p>
        </div>
      </div>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No form fields found. Please add some fields to your form first before setting up badge mappings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const availablePlaceholders = placeholderData?.placeholders || {};
  const suggestions = placeholderData?.suggestions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Badge Field Mapping</h3>
          <p className="text-sm text-muted-foreground">
            Map form fields to badge placeholders for automatic badge generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleAutoSuggest}
            disabled={suggestMappingsMutation.isPending}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {suggestMappingsMutation.isPending ? 'Suggesting...' : 'Auto Suggest'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Badge placeholders (like {{name}}, {{company}}) will be replaced with form data when generating badges.
          Map your form fields to create personalized badges automatically.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Fields Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Form Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {fields.map((field) => {
                  const mappedPlaceholders = getMappedPlaceholders(field);
                  const isSelected = selectedFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getFieldIcon(field.field_type)}</span>
                          <div>
                            <h4 className="font-medium">{field.label}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {field.field_type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {mappedPlaceholders.length > 0 && (
                            <Badge variant="secondary">
                              {mappedPlaceholders.length} mapped
                            </Badge>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {mappedPlaceholders.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {mappedPlaceholders.map((placeholder) => (
                            <Badge key={placeholder} variant="outline" className="text-xs">
                              {getPlaceholderIcon(placeholder)} {placeholder}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Badge Placeholders Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Badge Placeholders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {Object.entries(availablePlaceholders).map(([placeholder, label]) => {
                  const isMapped = isPlaceholderMapped(placeholder);
                  const mappedField = getFieldForPlaceholder(placeholder);

                  return (
                    <div
                      key={placeholder}
                      className={`p-3 border rounded-lg transition-all ${
                        isMapped
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getPlaceholderIcon(placeholder)}</span>
                          <div>
                            <h4 className="font-medium">{placeholder}</h4>
                            <p className="text-sm text-muted-foreground">{label}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMapped ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">Mapped</span>
                            </div>
                          ) : selectedFieldId ? (
                            <Button
                              size="sm"
                              onClick={() => handleCreateMapping(selectedFieldId, placeholder)}
                              disabled={createMappingMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Map
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Select field first</span>
                          )}
                        </div>
                      </div>

                      {isMapped && mappedField && (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Mapped to:</span>
                            <Badge variant="outline" className="text-xs">
                              {getFieldIcon(mappedField.field_type)} {mappedField.label}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const mapping = mappedField.badgeMappings?.find(
                                m => m.badge_placeholder === placeholder
                              );
                              if (mapping) {
                                handleDeleteMapping(mappedField.id, mapping.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Current Mappings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.some(field => field.badgeMappings && field.badgeMappings.length > 0) ? (
            <div className="space-y-3">
              {fields
                .filter(field => field.badgeMappings && field.badgeMappings.length > 0)
                .map(field => (
                  <div key={field.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{getFieldIcon(field.field_type)}</span>
                      <span className="font-medium">{field.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2">
                      {field.badgeMappings?.map(mapping => (
                        <Badge key={mapping.id} className="flex items-center gap-1">
                          {getPlaceholderIcon(mapping.badge_placeholder)}
                          {mapping.badge_placeholder}
                          <button
                            onClick={() => handleDeleteMapping(field.id, mapping.id)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No field mappings created yet.</p>
              <p className="text-sm">Select a form field and map it to a badge placeholder.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      {suggestions.length > 0 && (
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mapping Suggestions</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <span>{getPlaceholderIcon(suggestion.placeholder)}</span>
                    <div>
                      <p className="font-medium">{suggestion.placeholder}</p>
                      <p className="text-sm text-muted-foreground">
                        Suggested for {suggestion.label}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Apply suggestion
                      setShowSuggestions(false);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BadgeFieldMapper;
