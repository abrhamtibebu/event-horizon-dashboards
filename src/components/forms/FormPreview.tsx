import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { Form, FormField, TestSubmissionResult } from '@/types/forms';
import { formPreviewApi } from '@/lib/api/forms';

interface FormPreviewProps {
  formData: Form;
  fields: FormField[];
  onClose: () => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  formData,
  fields,
  onClose
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<TestSubmissionResult | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Initialize form values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.field_key] = field.default_value || getDefaultValueForType(field.field_type);
    });
    setFormValues(initialValues);
  }, [fields]);

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

    const fieldElement = (
      <div key={field.id} className="space-y-2">
        <Label className="flex items-center gap-2">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
          {field.conditional_logic && (
            <Badge variant="outline" className="text-xs">
              Conditional
            </Badge>
          )}
        </Label>

        {renderFieldInput(field, value, fieldKey)}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {field.placeholder && !value && (
          <p className="text-xs text-muted-foreground">{field.placeholder}</p>
        )}
      </div>
    );

    return fieldElement;
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
          <Input
            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' || field.field_type === 'datetime' ? field.field_type : 'text'}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={errors[fieldKey] ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={errors[fieldKey] ? 'border-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(value) => handleInputChange(fieldKey, value)}
          >
            <SelectTrigger className={errors[fieldKey] ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.fieldOptions?.map((option) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(value) => handleInputChange(fieldKey, value)}
          >
            {field.fieldOptions?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.option_value} id={`${fieldKey}-${option.id}`} />
                <Label htmlFor={`${fieldKey}-${option.id}`}>{option.option_label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.fieldOptions?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldKey}-${option.id}`}
                  checked={(value || []).includes(option.option_value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(fieldKey, option.option_value, checked as boolean)
                  }
                />
                <Label htmlFor={`${fieldKey}-${option.id}`}>{option.option_label}</Label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <Input
            type="file"
            className={errors[fieldKey] ? 'border-destructive' : ''}
          />
        );

      case 'address':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder || 'Enter full address'}
            rows={3}
            className={errors[fieldKey] ? 'border-destructive' : ''}
          />
        );

      case 'hidden':
        return null; // Hidden fields are not shown in preview

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={errors[fieldKey] ? 'border-destructive' : ''}
          />
        );
    }
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
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
            // Basic phone validation - adjust as needed
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

  const handleTestSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsTesting(true);
    try {
      const result = await formPreviewApi.testSubmit(formData.id, {
        submission_data: formValues
      });
      setTestResult(result);
      setShowTestDialog(true);
    } catch (error: any) {
      setTestResult({
        success: false,
        validated_data: formValues,
        validation_errors: [],
        conditional_logic_results: [],
        badge_mappings: [],
        errors: [error?.message || 'Test submission failed']
      });
      setShowTestDialog(true);
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.field_key] = field.default_value || getDefaultValueForType(field.field_type);
    });
    setFormValues(initialValues);
    setErrors({});
    setTestResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Builder
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-semibold">Form Preview</h2>
            <p className="text-sm text-muted-foreground">{formData.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetForm}>
            Reset Form
          </Button>
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={handleTestSubmit}
                disabled={isTesting}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {isTesting ? 'Testing...' : 'Test Form'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Test Submission Results</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {testResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {testResult.success ? 'Test Passed' : 'Test Failed'}
                      </span>
                    </div>

                    <Tabs defaultValue="data" className="w-full">
                      <TabsList>
                        <TabsTrigger value="data">Submitted Data</TabsTrigger>
                        <TabsTrigger value="validation">Validation</TabsTrigger>
                        <TabsTrigger value="logic">Conditional Logic</TabsTrigger>
                        <TabsTrigger value="mappings">Badge Mappings</TabsTrigger>
                      </TabsList>

                      <TabsContent value="data" className="space-y-2">
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                          {JSON.stringify(testResult.validated_data, null, 2)}
                        </pre>
                      </TabsContent>

                      <TabsContent value="validation" className="space-y-2">
                        {testResult.validation_errors.length > 0 ? (
                          testResult.validation_errors.map((error, index) => (
                            <Alert key={index}>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error.message}</AlertDescription>
                            </Alert>
                          ))
                        ) : (
                          <p className="text-green-600">✓ All validation passed</p>
                        )}
                      </TabsContent>

                      <TabsContent value="logic" className="space-y-2">
                        {testResult.conditional_logic_results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>{result.field}</span>
                            <Badge variant={result.should_show ? 'default' : 'secondary'}>
                              {result.should_show ? 'Shown' : 'Hidden'}
                            </Badge>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="mappings" className="space-y-2">
                        {testResult.badge_mappings.map((mapping, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>{mapping.field_key}</span>
                            <Badge variant="outline">
                              {mapping.badge_placeholder}
                            </Badge>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {formData.name}
              </CardTitle>
              {formData.description && (
                <p className="text-muted-foreground">{formData.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map(field => renderField(field))}

              {Object.keys(errors).length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please fix the errors above before submitting.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
