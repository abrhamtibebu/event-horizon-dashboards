import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, MapPin, User, Mail, Phone, Hash, Type, FileText as FileTextIcon, ChevronDown, Circle, CheckSquare } from 'lucide-react';
import type { FormField } from '@/types/forms';

interface FormFieldRendererProps {
  field: FormField;
  value: any;
  error?: string;
  onChange: (fieldKey: string, value: any) => void;
  onCheckboxChange?: (fieldKey: string, optionValue: string, checked: boolean) => void;
  conditionalLogicEvaluator?: (logic: any, formData: Record<string, any>) => boolean;
  formData?: Record<string, any>;
}

const getFieldIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'text':
      return <Type className="w-4 h-4 text-primary/60" />;
    case 'email':
      return <Mail className="w-4 h-4 text-primary/60" />;
    case 'phone':
      return <Phone className="w-4 h-4 text-primary/60" />;
    case 'number':
      return <Hash className="w-4 h-4 text-primary/60" />;
    case 'date':
    case 'datetime':
      return <CalendarIcon className="w-4 h-4 text-primary/60" />;
    case 'textarea':
      return <FileTextIcon className="w-4 h-4 text-primary/60" />;
    case 'address':
      return <MapPin className="w-4 h-4 text-primary/60" />;
    case 'select':
      return <ChevronDown className="w-4 h-4 text-primary/60" />;
    case 'radio':
      return <Circle className="w-4 h-4 text-primary/60" />;
    case 'checkbox':
      return <CheckSquare className="w-4 h-4 text-primary/60" />;
    case 'user':
      return <User className="w-4 h-4 text-primary/60" />;
    default:
      return <Type className="w-4 h-4 text-primary/60" />;
  }
};

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  error,
  onChange,
  onCheckboxChange,
  conditionalLogicEvaluator,
  formData = {}
}) => {
  const fieldKey = field.field_key;
  const isRequired = field.is_required;

  // Check conditional logic
  if (field.conditional_logic && conditionalLogicEvaluator) {
    const shouldShow = conditionalLogicEvaluator(field.conditional_logic, formData);
    if (!shouldShow) {
      return null; // Don't render this field
    }
  }

  return (
    <div className="space-y-3 group">
      <div className="flex items-center gap-2">
        <Label htmlFor={fieldKey} className="text-sm font-semibold text-foreground flex items-center gap-2">
          {getFieldIcon(field.field_type)}
          {field.label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.conditional_logic && (
          <Badge variant="outline" className="text-xs border-primary/20 text-primary/80">
            Conditional
          </Badge>
        )}
      </div>

      <div className="relative">
        {renderFieldInput(field, value, fieldKey, onChange, onCheckboxChange, error)}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span className="w-1 h-1 bg-destructive rounded-full"></span>
          {error}
        </p>
      )}
      {field.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {field.description}
        </p>
      )}
    </div>
  );
};

const renderFieldInput = (
  field: FormField,
  value: any,
  fieldKey: string,
  onChange: (fieldKey: string, value: any) => void,
  onCheckboxChange?: (fieldKey: string, optionValue: string, checked: boolean) => void,
  error?: string
) => {
  const baseInputClasses = `transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-primary/30 ${
    error ? 'border-destructive focus:ring-destructive/20' : 'border-input'
  }`;

  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <div className="relative">
          <Input
            id={fieldKey}
            type={field.field_type === 'number' ? 'number' : field.field_type}
            value={value || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={`h-11 ${baseInputClasses}`}
            required={field.is_required}
          />
          {field.field_type === 'phone' && (
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
          {field.field_type === 'email' && (
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>
      );

    case 'date':
    case 'datetime':
      return (
        <div className="relative">
          <Input
            id={fieldKey}
            type={field.field_type}
            value={value || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={`h-11 ${baseInputClasses} pr-10`}
            required={field.is_required}
          />
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      );

    case 'textarea':
      return (
        <Textarea
          id={fieldKey}
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`min-h-[80px] resize-none ${baseInputClasses}`}
          required={field.is_required}
        />
      );

    case 'select':
      return (
        <Select
          value={value || ''}
          onValueChange={(newValue) => onChange(fieldKey, newValue)}
          required={field.is_required}
        >
          <SelectTrigger className={`h-11 ${baseInputClasses}`} id={fieldKey}>
            <SelectValue placeholder={field.placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
            {field.fieldOptions?.map((option) => (
              <SelectItem
                key={option.id}
                value={option.option_value}
                className="hover:bg-primary/5 focus:bg-primary/5"
              >
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
          onValueChange={(newValue) => onChange(fieldKey, newValue)}
          className="space-y-3"
          required={field.is_required}
        >
          {field.fieldOptions?.map((option) => (
            <div key={option.id} className="flex items-center space-x-3 group">
              <RadioGroupItem
                value={option.option_value}
                id={`${fieldKey}-${option.id}`}
                className="border-2 border-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary group-hover:border-primary/50 transition-colors"
              />
              <Label
                htmlFor={`${fieldKey}-${option.id}`}
                className="text-sm font-medium cursor-pointer group-hover:text-primary/80 transition-colors flex-1"
              >
                {option.option_label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'checkbox':
      if (field.fieldOptions && field.fieldOptions.length > 1) {
        // Multiple checkbox options
        return (
          <div className="space-y-3">
            {field.fieldOptions?.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 group">
                <Checkbox
                  id={`${fieldKey}-${option.id}`}
                  checked={(value || []).includes(option.option_value)}
                  onCheckedChange={(checked) =>
                    onCheckboxChange?.(fieldKey, option.option_value, checked as boolean)
                  }
                  className="border-2 border-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary group-hover:border-primary/50 transition-colors"
                />
                <Label
                  htmlFor={`${fieldKey}-${option.id}`}
                  className="text-sm font-medium cursor-pointer group-hover:text-primary/80 transition-colors flex-1"
                >
                  {option.option_label}
                </Label>
              </div>
            ))}
          </div>
        );
      } else {
        // Single checkbox
        return (
          <div className="flex items-center space-x-3 group">
            <Checkbox
              id={fieldKey}
              checked={!!value}
              onCheckedChange={(checked) => onChange(fieldKey, checked)}
              className="border-2 border-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary group-hover:border-primary/50 transition-colors"
            />
            <Label
              htmlFor={fieldKey}
              className="text-sm font-medium cursor-pointer group-hover:text-primary/80 transition-colors"
            >
              {field.placeholder || field.label}
            </Label>
          </div>
        );
      }

    case 'file':
      return (
        <div className="relative">
          <Input
            id={fieldKey}
            type="file"
            className={`h-11 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-primary/5 file:text-primary hover:file:bg-primary/10 ${baseInputClasses}`}
            required={field.is_required}
          />
        </div>
      );

    case 'address':
      return (
        <div className="relative">
          <Textarea
            id={fieldKey}
            value={value || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={field.placeholder || 'Enter full address'}
            rows={3}
            className={`min-h-[80px] resize-none ${baseInputClasses} pr-10`}
            required={field.is_required}
          />
          <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
        </div>
      );

      case 'payment':
        return (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="text-sm font-medium">
              Payment Amount: {field.validation_rules?.currency || 'ETB'} {field.validation_rules?.amount || '0.00'}
            </div>
            {field.validation_rules?.payment_description && (
              <div className="text-sm text-muted-foreground">
                {field.validation_rules.payment_description}
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Payment Method:</label>
              <div className="grid grid-cols-1 gap-2">
                {(field.validation_rules?.payment_methods || ['telebirr', 'cbe_birr', 'card']).map((method: string) => (
                  <label key={method} className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-muted">
                    <input
                      type="radio"
                      name={`payment_${fieldKey}`}
                      value={method}
                      checked={value?.method === method}
                      onChange={(e) => onChange(fieldKey, { ...value, method: e.target.value })}
                      required={field.is_required}
                      className="text-primary"
                    />
                    <span className="text-sm capitalize">
                      {method.replace('_', ' ')}
                      {method === 'telebirr' && ' 📱'}
                      {method === 'cbe_birr' && ' 🏦'}
                      {method === 'card' && ' 💳'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recurring Payment Info */}
            {field.validation_rules?.is_recurring && (
              <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
                This is a recurring payment ({field.validation_rules.recurring_interval}) for {field.validation_rules.recurring_count} payments.
              </div>
            )}
          </div>
        );

      case 'hidden':
        return (
          <input
            type="hidden"
            value={value || ''}
          />
        );

      default:
        return (
          <Input
            id={fieldKey}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className={`h-11 ${baseInputClasses}`}
            required={field.is_required}
          />
        );
  }
};

export default FormFieldRenderer;
