import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { formApi, formSubmissionApi } from '@/lib/api/forms';
import type {
  Form,
  FormField,
  SubmissionResult,
  FormSubmissionRequest
} from '@/types/forms';

interface DynamicFormRendererProps {
  eventId: number;
  guestTypeId: number;
  participantType?: string; // Deprecated - kept for backward compatibility
  onSuccess?: (result: SubmissionResult) => void;
  onError?: (error: string) => void;
  onFallback?: () => void; // Called when no custom form is available
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  eventId,
  guestTypeId,
  participantType,
  onSuccess,
  onError,
  onFallback
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch form for this guest type
  const {
    data: activeForm,
    isLoading: formsLoading,
    error: formsError
  } = useQuery({
    queryKey: ['event-form-by-guest-type', eventId, guestTypeId],
    queryFn: () => formApi.getFormByGuestType(eventId, guestTypeId),
    enabled: !!guestTypeId,
    retry: false,
  });

  // Get form data with fields if we have an active form
  const {
    data: formData,
    isLoading: previewLoading,
    error: previewError
  } = useQuery({
    queryKey: ['form', activeForm?.id],
    queryFn: () => activeForm ? formApi.getForm(activeForm.id) : null,
    enabled: !!activeForm && activeForm.status === 'active' && (!activeForm.expires_at || new Date(activeForm.expires_at) > new Date()),
  });

  // Transform form data to preview format
  const formPreview = formData ? {
    form: {
      id: formData.id,
      name: formData.name,
      form_type: formData.form_type,
      description: formData.description,
      is_multi_page: formData.is_multi_page,
      status: formData.status
    },
    fields: formData.formFields || [],
    pages: {},
    conditional_logic: [],
    validation_rules: {}
  } : null;

  // If no active form, use fallback
  useEffect(() => {
    if (!formsLoading && !activeForm) {
      onFallback?.();
    }
  }, [formsLoading, activeForm, onFallback]);

  // Initialize form values when form data loads
  useEffect(() => {
    if (formPreview?.fields) {
      const initialValues: Record<string, any> = {};
      formPreview.fields.forEach(field => {
        initialValues[field.field_key] = field.default_value || getDefaultValueForType(field.field_type);
      });
      setFormValues(initialValues);
    }
  }, [formPreview]);

  const getDefaultValueForType = (fieldType: string): any => {
    switch (fieldType) {
      case 'checkbox':
        return [];
      case 'number':
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));

    // Clear error for this field
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (fieldKey: string, optionValue: string, checked: boolean) => {
    setFormValues(prev => {
      const currentValues = prev[fieldKey] || [];
      if (checked) {
        return {
          ...prev,
          [fieldKey]: [...currentValues, optionValue]
        };
      } else {
        return {
          ...prev,
          [fieldKey]: currentValues.filter((v: string) => v !== optionValue)
        };
      }
    });
  };

  const validateCurrentPage = (): boolean => {
    if (!formPreview?.fields) return true;

    const currentPageFields = formPreview.fields.filter(field => field.page_number === currentPage);
    const newErrors: Record<string, string> = {};

    currentPageFields.forEach(field => {
      const fieldKey = field.field_key;
      const value = formValues[fieldKey];

      // Check required fields
      if (field.is_required) {
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          newErrors[fieldKey] = `${field.label} is required`;
          return;
        }
      }

      // Check conditional logic - skip validation if field is hidden
      if (field.conditional_logic) {
        const shouldShow = evaluateConditionalLogic(field.conditional_logic, formValues);
        if (!shouldShow) return; // Skip validation for hidden fields
      }

      // Type-specific validation
      if (value) {
        switch (field.field_type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              newErrors[fieldKey] = 'Please enter a valid email address';
            }
            break;

          case 'number':
            if (isNaN(Number(value))) {
              newErrors[fieldKey] = 'Please enter a valid number';
            }
            break;

          case 'phone':
            // Basic phone validation
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
              newErrors[fieldKey] = 'Please enter a valid phone number';
            }
            break;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const evaluateConditionalLogic = (logic: any, formData: Record<string, any>): boolean => {
    if (!logic) return true;

    const fieldValue = formData[logic.field_id];
    if (fieldValue === undefined || fieldValue === null) return false;

    switch (logic.operator) {
      case 'equals':
        return fieldValue === logic.value;
      case 'not_equals':
        return fieldValue !== logic.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(logic.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(logic.value);
      case 'less_than':
        return Number(fieldValue) < Number(logic.value);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return true;
    }
  };

  const handleNextPage = () => {
    if (validateCurrentPage()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage() || !activeForm) return;

    setIsSubmitting(true);
    try {
      // Check if form contains payment fields
      const hasPaymentFields = formPreview?.fields.some(field => field.field_type === 'payment') || false;

      if (hasPaymentFields) {
        // For forms with payment fields, redirect to payment flow
        // This would integrate with the existing payment system
        const submissionData: FormSubmissionRequest = {
          submission_data: formValues
        };

        // First create the form submission
        const result = await formSubmissionApi.submitForm(activeForm.id, submissionData);

        // Then redirect to payment processing
        // This would trigger the payment flow with the form data
        onSuccess?.({
          ...result,
          requires_payment: true,
          payment_data: {
            amount: calculateTotalPayment(),
            currency: 'ETB',
            description: activeForm.name,
            form_submission_id: result.submission?.id
          }
        });
      } else {
        // Regular form submission without payment
        const submissionData: FormSubmissionRequest = {
          submission_data: formValues
        };

        const result = await formSubmissionApi.submitForm(activeForm.id, submissionData);
        onSuccess?.(result);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit form';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPayment = (): number => {
    if (!formPreview?.fields) return 0;

    return formPreview.fields
      .filter(field => field.field_type === 'payment')
      .reduce((total, field) => {
        return total + (field.validation_rules?.amount || 0);
      }, 0);
  };

  const renderField = (field: FormField) => {
    const fieldKey = field.field_key;
    const value = formValues[fieldKey];
    const error = errors[fieldKey];
    const isRequired = field.is_required;

    // Check conditional logic
    if (field.conditional_logic) {
      const shouldShow = evaluateConditionalLogic(field.conditional_logic, formValues);
      if (!shouldShow) {
        return null; // Don't render this field
      }
    }

    return (
      <div key={field.id} className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
          {field.conditional_logic && (
            <Badge variant="outline" className="text-xs">
              Conditional
            </Badge>
          )}
        </label>

        {renderFieldInput(field, value, fieldKey)}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {field.placeholder && !value && (
          <p className="text-xs text-muted-foreground">{field.placeholder}</p>
        )}
      </div>
    );
  };

  const renderFieldInput = (field: FormField, value: any, fieldKey: string) => {
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'date':
      case 'datetime':
      case 'number':
        return (
          <input
            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' || field.field_type === 'datetime' ? field.field_type : 'text'}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors[fieldKey] ? 'border-destructive' : 'border-input'
            }`}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${
              errors[fieldKey] ? 'border-destructive' : 'border-input'
            }`}
            required={field.is_required}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors[fieldKey] ? 'border-destructive' : 'border-input'
            }`}
            required={field.is_required}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.fieldOptions?.map((option) => (
              <option key={option.id} value={option.option_value}>
                {option.option_label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.fieldOptions?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={fieldKey}
                  value={option.option_value}
                  checked={value === option.option_value}
                  onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                  required={field.is_required}
                  className="text-primary focus:ring-primary/50"
                />
                <span className="text-sm">{option.option_label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.fieldOptions?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.option_value}
                  checked={(value || []).includes(option.option_value)}
                  onChange={(e) => handleCheckboxChange(fieldKey, option.option_value, e.target.checked)}
                  className="text-primary focus:ring-primary/50"
                />
                <span className="text-sm">{option.option_label}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors[fieldKey] ? 'border-destructive' : 'border-input'
            }`}
            required={field.is_required}
          />
        );

      case 'address':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder || 'Enter full address'}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${
              errors[fieldKey] ? 'border-destructive' : 'border-input'
            }`}
            required={field.is_required}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors[fieldKey] ? 'border-destructive' : 'border-input'
            }`}
            required={field.is_required}
          />
        );
    }
  };

  // Loading state
  if (formsLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading registration form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (formsError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load registration form. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // No active form - fallback
  if (!activeForm) {
    return null; // This will trigger the onFallback callback
  }

  // Loading preview
  if (previewLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading form fields...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview error
  if (previewError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load form configuration. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!formPreview) {
    return null;
  }

  const currentPageFields = formPreview.fields.filter(field => field.page_number === currentPage);
  const totalPages = formPreview.form.is_multi_page ? Math.max(...formPreview.fields.map(f => f.page_number)) : 1;
  const progress = (currentPage / totalPages) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{formPreview.form.name}</h3>
            <p className="text-sm text-muted-foreground">
              {activeForm?.guest_type?.name || participantType?.charAt(0).toUpperCase() + participantType?.slice(1) || 'Registration'}
            </p>
          </div>
          {formPreview.form.is_multi_page && (
            <Badge variant="outline">
              Page {currentPage} of {totalPages}
            </Badge>
          )}
        </CardTitle>
        {formPreview.form.is_multi_page && (
          <Progress value={progress} className="w-full" />
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {formPreview.form.description && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            {formPreview.form.description}
          </div>
        )}

        {errors.general && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {currentPageFields.map(field => renderField(field))}
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentPage < totalPages ? (
              <Button
                onClick={handleNextPage}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicFormRenderer;
