import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Send,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  const formPreview = useMemo(() => {
    if (!formData) return null;

    // Handle potential data wrapping from API
    const actualFormData = (formData as any).data || formData;

    return {
      form: {
        id: actualFormData.id,
        name: actualFormData.name,
        form_type: actualFormData.form_type,
        description: actualFormData.description,
        is_multi_page: actualFormData.is_multi_page,
        status: actualFormData.status
      },
      fields: actualFormData.formFields || actualFormData.form_fields || [],
      pages: {},
      conditional_logic: [],
      validation_rules: {}
    };
  }, [formData]);

  // If no active form, use fallback
  useEffect(() => {
    if (!formsLoading && !activeForm) {
      onFallback?.();
    }
  }, [formsLoading, activeForm, onFallback]);

  // Initialize form values when form data loads or form changes
  useEffect(() => {
    if (formPreview?.fields) {
      const initialValues: Record<string, any> = {};
      formPreview.fields.forEach(field => {
        initialValues[field.field_key] = field.default_value || getDefaultValueForType(field.field_type);
      });
      setFormValues(initialValues);
    }
  }, [formPreview?.form?.id]); // Only re-run when the form ID specifically changes

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
    if (!logic || (typeof logic === 'object' && Object.keys(logic).length === 0)) return true;

    // Supports both 'field_id' and 'field_key' as the identifier
    const identifier = logic.field_id || logic.field_key;
    if (!identifier) return true;

    const fieldValue = formData[identifier];
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

    const getFieldIcon = (type: string) => {
      switch (type) {
        case 'email': return <Mail className="w-4 h-4" />;
        case 'phone': return <Phone className="w-4 h-4" />;
        case 'number': return <AlertCircle className="w-4 h-4" />;
        default: return <User className="w-4 h-4" />;
      }
    };

    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          {getFieldIcon(field.field_type)}
          {field.label}
          {isRequired && <span className="text-primary">*</span>}
        </Label>

        {renderFieldInput(field, value, fieldKey)}

        {error && (
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{error}</p>
        )}
      </div>
    );
  };

  const renderFieldInput = (field: FormField, value: any, fieldKey: string) => {
    const commonClasses = `h-12 rounded-2xl bg-white dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all ${errors[fieldKey] ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''
      }`;

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <Input
            type={field.field_type === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            required={field.is_required}
          />
        );

      case 'date':
      case 'datetime':
        return (
          <Input
            type={field.field_type}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            className={commonClasses}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={`rounded-2xl bg-white dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px] ${errors[fieldKey] ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''
              }`}
            required={field.is_required}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleInputChange(fieldKey, val)}
          >
            <SelectTrigger className={commonClasses}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {(field.fieldOptions || (field as any).field_options || []).map((option: any) => (
                <SelectItem key={option.id} value={option.option_value} className="rounded-xl">
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <div className="grid grid-cols-1 gap-3">
            {(field.fieldOptions || (field as any).field_options || []).map((option: any) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all cursor-pointer ${value === option.option_value
                  ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5 scale-[1.01]'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-primary/30'
                  }`}
              >
                <input
                  type="radio"
                  name={fieldKey}
                  value={option.option_value}
                  checked={value === option.option_value}
                  onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                  className="w-5 h-5 text-primary accent-primary"
                />
                <span className="text-sm font-bold">{option.option_label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="grid grid-cols-1 gap-3">
            {(field.fieldOptions || (field as any).field_options || []).map((option: any) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all cursor-pointer ${(value || []).includes(option.option_value)
                  ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5 scale-[1.01]'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-primary/30'
                  }`}
              >
                <Checkbox
                  id={`check-${option.id}`}
                  checked={(value || []).includes(option.option_value)}
                  onCheckedChange={(checked) => handleCheckboxChange(fieldKey, option.option_value, !!checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm font-bold">{option.option_label}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="relative">
            <Input
              type="file"
              className={commonClasses}
              required={field.is_required}
            />
          </div>
        );

      case 'address':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder || 'Enter full address'}
            className={`rounded-2xl bg-white dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all min-h-[80px] ${errors[fieldKey] ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''
              }`}
            required={field.is_required}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            required={field.is_required}
          />
        );
    }
  };

  // Loading state
  if (formsLoading) {
    return (
      <div className="p-12 text-center animate-pulse">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Loading Form...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (formsError) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
        <div className="flex items-center gap-4 text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-bold text-sm uppercase tracking-tight">Form Error</p>
            <p className="text-xs opacity-80">Failed to load registration form. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // No active form - fallback
  if (!activeForm) {
    return null; // This will trigger the onFallback callback
  }

  // Loading preview
  if (previewLoading) {
    return (
      <div className="p-12 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initialising Fields...</p>
        </div>
      </div>
    );
  }

  // Preview error
  if (previewError) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
        <div className="flex items-center gap-4 text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-bold text-sm uppercase tracking-tight">Configuration Error</p>
            <p className="text-xs opacity-80">Failed to load form configuration. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formPreview) {
    return null;
  }

  const currentPageFields = formPreview.form.is_multi_page
    ? formPreview.fields.filter(field => (field.page_number || 1) === currentPage)
    : formPreview.fields;

  const totalPages = formPreview.form.is_multi_page
    ? Math.max(1, ...formPreview.fields.map(f => f.page_number || 1))
    : 1;
  const progress = (currentPage / totalPages) * 100;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formPreview.form.name}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {activeForm?.guest_type?.name || participantType?.charAt(0).toUpperCase() + participantType?.slice(1) || 'Registration'} Form
            </p>
          </div>
          {formPreview.form.is_multi_page && totalPages > 1 && (
            <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1">
              Step {currentPage} of {totalPages}
            </Badge>
          )}
        </div>

        {formPreview.form.is_multi_page && totalPages > 1 && (
          <Progress value={progress} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
        )}
      </div>

      {formPreview.form.description && (
        <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/20 p-4 rounded-2xl">
          <p className="text-sm text-blue-700/80 dark:text-blue-300/80 leading-relaxed italic">
            &ldquo;{formPreview.form.description}&rdquo;
          </p>
        </div>
      )}

      {errors.general && (
        <Alert variant="destructive" className="rounded-2xl bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-bold text-xs uppercase tracking-tight">{errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        {currentPageFields.map(field => renderField(field))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="ghost"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="rounded-xl h-12 px-6 font-bold text-slate-500 hover:text-primary transition-all disabled:opacity-0 w-full sm:w-auto order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto order-1 sm:order-2">
          {currentPage < totalPages ? (
            <Button
              onClick={handleNextPage}
              className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-12 px-10 rounded-2xl bg-primary hover:bg-primary-hover text-white font-extrabold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                'Register Now'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicFormRenderer;
