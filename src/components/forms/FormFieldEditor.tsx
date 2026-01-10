import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FormField, CreateFormFieldRequest } from '@/types/forms';

interface FormFieldEditorProps {
  field: FormField | null;
  onSave: (fieldData: CreateFormFieldRequest) => void;
  onCancel: () => void;
  onDelete?: () => void;
  availableFields?: FormField[]; // For conditional logic
}

export const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  field,
  onSave,
  onCancel,
  onDelete,
  availableFields = []
}) => {
  const [fieldData, setFieldData] = useState<CreateFormFieldRequest>({
    field_type: 'text',
    label: '',
    placeholder: '',
    is_required: false,
    default_value: null,
    validation_rules: {},
    conditional_logic: null,
    order: 0,
    page_number: 1,
    options: []
  });

  // Initialize form data when field changes
  useEffect(() => {
    if (field) {
      setFieldData({
        field_type: field.field_type,
        label: field.label,
        placeholder: field.placeholder || '',
        is_required: field.is_required,
        default_value: field.default_value,
        validation_rules: field.validation_rules || {},
        conditional_logic: field.conditional_logic,
        order: field.order,
        page_number: field.page_number,
        options: field.fieldOptions?.map(opt => ({
          label: opt.option_label,
          value: opt.option_value
        })) || []
      });
    } else {
      // Reset for new field
      setFieldData({
        field_type: 'text',
        label: '',
        placeholder: '',
        is_required: false,
        default_value: null,
        validation_rules: {},
        conditional_logic: null,
        order: 0,
        page_number: 1,
        options: []
      });
    }
  }, [field]);

  const handleSave = () => {
    if (!fieldData.label.trim()) {
      alert('Field label is required');
      return;
    }

    // Validate options for select/radio/checkbox
    if (['select', 'radio', 'checkbox'].includes(fieldData.field_type)) {
      if (!fieldData.options || fieldData.options.length === 0) {
        alert('At least one option is required for this field type');
        return;
      }
    }

    onSave(fieldData);
  };

  const addOption = () => {
    setFieldData(prev => ({
      ...prev,
      options: [...(prev.options || []), { label: '', value: '' }]
    }));
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    setFieldData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) =>
        i === index ? { ...opt, [key]: value } : opt
      ) || []
    }));
  };

  const removeOption = (index: number) => {
    setFieldData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const updateValidationRule = (key: string, value: any) => {
    setFieldData(prev => ({
      ...prev,
      validation_rules: {
        ...prev.validation_rules,
        [key]: value
      }
    }));
  };

  const updateConditionalLogic = (logic: any) => {
    setFieldData(prev => ({
      ...prev,
      conditional_logic: logic
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          {field ? 'Edit Field' : 'Add New Field'}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="payment" disabled={fieldData.field_type !== 'payment'}>Payment</TabsTrigger>
            <TabsTrigger value="logic">Logic</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Field Type */}
            <div className="space-y-2">
              <Label htmlFor="field_type">Field Type</Label>
              <Select
                value={fieldData.field_type}
                onValueChange={(value) => setFieldData(prev => ({ ...prev, field_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Single Line Text</SelectItem>
                  <SelectItem value="textarea">Multi-line Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="datetime">Date & Time</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="radio">Radio Buttons</SelectItem>
                  <SelectItem value="checkbox">Checkboxes</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="payment">Payment Field</SelectItem>
                  <SelectItem value="hidden">Hidden Field</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Field Label *</Label>
              <Input
                id="label"
                value={fieldData.label}
                onChange={(e) => setFieldData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Enter field label"
              />
            </div>

            {/* Placeholder */}
            {fieldData.field_type !== 'hidden' && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={fieldData.placeholder}
                  onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            {/* Required Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={fieldData.is_required}
                onCheckedChange={(checked) => setFieldData(prev => ({ ...prev, is_required: checked }))}
              />
              <Label htmlFor="required">Required field</Label>
            </div>

            {/* Default Value */}
            <div className="space-y-2">
              <Label htmlFor="default_value">Default Value</Label>
              {fieldData.field_type === 'textarea' ? (
                <Textarea
                  id="default_value"
                  value={fieldData.default_value || ''}
                  onChange={(e) => setFieldData(prev => ({ ...prev, default_value: e.target.value }))}
                  placeholder="Enter default value"
                  rows={3}
                />
              ) : (
                <Input
                  id="default_value"
                  value={fieldData.default_value || ''}
                  onChange={(e) => setFieldData(prev => ({ ...prev, default_value: e.target.value }))}
                  placeholder="Enter default value"
                />
              )}
            </div>

            {/* Options for select/radio/checkbox */}
            {['select', 'radio', 'checkbox'].includes(fieldData.field_type) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fieldData.options?.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )) || []}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Configure validation rules for this field
            </div>

            {/* Text/Email validation */}
            {(fieldData.field_type === 'text' || fieldData.field_type === 'textarea' || fieldData.field_type === 'email') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_length">Min Length</Label>
                    <Input
                      id="min_length"
                      type="number"
                      value={fieldData.validation_rules?.min_length || ''}
                      onChange={(e) => updateValidationRule('min_length', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_length">Max Length</Label>
                    <Input
                      id="max_length"
                      type="number"
                      value={fieldData.validation_rules?.max_length || ''}
                      onChange={(e) => updateValidationRule('max_length', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="255"
                    />
                  </div>
                </div>

                {fieldData.field_type === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Email Pattern (Regex)</Label>
                    <Input
                      id="pattern"
                      value={fieldData.validation_rules?.pattern || ''}
                      onChange={(e) => updateValidationRule('pattern', e.target.value)}
                      placeholder="Custom regex pattern"
                    />
                  </div>
                )}
              </>
            )}

            {/* Number validation */}
            {fieldData.field_type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_value">Min Value</Label>
                  <Input
                    id="min_value"
                    type="number"
                    value={fieldData.validation_rules?.min_value || ''}
                    onChange={(e) => updateValidationRule('min_value', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_value">Max Value</Label>
                  <Input
                    id="max_value"
                    type="number"
                    value={fieldData.validation_rules?.max_value || ''}
                    onChange={(e) => updateValidationRule('max_value', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            {/* File validation */}
            {fieldData.field_type === 'file' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accepted_types">Accepted File Types</Label>
                  <Input
                    id="accepted_types"
                    value={fieldData.validation_rules?.accepted_types || ''}
                    onChange={(e) => updateValidationRule('accepted_types', e.target.value)}
                    placeholder="image/*, .pdf, .doc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_size">Max File Size (MB)</Label>
                  <Input
                    id="max_size"
                    type="number"
                    value={fieldData.validation_rules?.max_size || ''}
                    onChange={(e) => updateValidationRule('max_size', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="5"
                  />
                </div>
              </div>
            )}

            {/* Custom error message */}
            <div className="space-y-2">
              <Label htmlFor="custom_message">Custom Error Message</Label>
              <Input
                id="custom_message"
                value={fieldData.validation_rules?.custom_message || ''}
                onChange={(e) => updateValidationRule('custom_message', e.target.value)}
                placeholder="Custom validation error message"
              />
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Configure payment settings for this field
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label>Payment Methods</Label>
              <div className="space-y-2">
                {[
                  { value: 'telebirr', label: 'TeleBirr' },
                  { value: 'cbe_birr', label: 'CBE Birr' },
                  { value: 'card', label: 'Credit/Debit Card' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                ].map((method) => (
                  <label key={method.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldData.validation_rules?.payment_methods?.includes(method.value) || false}
                      onChange={(e) => {
                        const currentMethods = fieldData.validation_rules?.payment_methods || [];
                        const newMethods = e.target.checked
                          ? [...currentMethods, method.value]
                          : currentMethods.filter(m => m !== method.value);
                        updateValidationRule('payment_methods', newMethods);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Fixed Amount (ETB)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={fieldData.validation_rules?.amount || ''}
                  onChange={(e) => updateValidationRule('amount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={fieldData.validation_rules?.currency || 'ETB'}
                  onValueChange={(value) => updateValidationRule('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETB">ETB (Ethiopian Birr)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Description */}
            <div className="space-y-2">
              <Label htmlFor="payment_description">Payment Description</Label>
              <Textarea
                id="payment_description"
                value={fieldData.validation_rules?.payment_description || ''}
                onChange={(e) => updateValidationRule('payment_description', e.target.value)}
                placeholder="Describe what this payment is for"
                rows={3}
              />
            </div>

            {/* Recurring Payment */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={fieldData.validation_rules?.is_recurring || false}
                  onChange={(e) => updateValidationRule('is_recurring', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_recurring">Recurring Payment</Label>
              </div>

              {fieldData.validation_rules?.is_recurring && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="recurring_interval">Interval</Label>
                    <Select
                      value={fieldData.validation_rules?.recurring_interval || 'monthly'}
                      onValueChange={(value) => updateValidationRule('recurring_interval', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurring_count">Number of Payments</Label>
                    <Input
                      id="recurring_count"
                      type="number"
                      value={fieldData.validation_rules?.recurring_count || ''}
                      onChange={(e) => updateValidationRule('recurring_count', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="12"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logic" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Configure conditional logic to show/hide this field
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_logic"
                  checked={!!fieldData.conditional_logic}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateConditionalLogic({
                        field_id: availableFields[0]?.id || null,
                        operator: 'equals',
                        value: ''
                      });
                    } else {
                      updateConditionalLogic(null);
                    }
                  }}
                />
                <Label htmlFor="has_logic">Enable conditional logic</Label>
              </div>

              {fieldData.conditional_logic && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>When this field:</Label>
                    <Select
                      value={fieldData.conditional_logic.field_id?.toString() || ''}
                      onValueChange={(value) => updateConditionalLogic({
                        ...fieldData.conditional_logic,
                        field_id: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((availableField) => (
                          <SelectItem key={availableField.id} value={availableField.id.toString()}>
                            {availableField.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator:</Label>
                    <Select
                      value={fieldData.conditional_logic.operator || 'equals'}
                      onValueChange={(value) => updateConditionalLogic({
                        ...fieldData.conditional_logic,
                        operator: value as any
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="is_empty">Is Empty</SelectItem>
                        <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value:</Label>
                    <Input
                      value={fieldData.conditional_logic.value || ''}
                      onChange={(e) => updateConditionalLogic({
                        ...fieldData.conditional_logic,
                        value: e.target.value
                      })}
                      placeholder="Enter value to match"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            {field ? 'Update Field' : 'Add Field'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {field && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormFieldEditor;
