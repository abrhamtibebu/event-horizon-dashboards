import React, { useState } from 'react';
import { AlertCircle, ChevronDown, Copy, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConditionalLogic, CreateFormFieldRequest, FieldType, FormField, ValidationRules } from '@/types/forms';
import {
  CONDITION_OPERATORS,
  FIELD_TYPES,
  conditionParent,
  fieldTypeInfo,
  isChoiceType,
  operatorNeedsValue,
} from './fieldTypes';

interface FormFieldEditorProps {
  field: FormField | null;
  initialType?: string;
  onSave: (fieldData: CreateFormFieldRequest) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  /** Other fields in the form, used for follow-up conditions. */
  availableFields?: FormField[];
  isSaving?: boolean;
}

type OptionDraft = { label: string; value: string };

const blankOptions = (): OptionDraft[] => [
  { label: '', value: '' },
  { label: '', value: '' },
];

const comparable = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

const initialFieldData = (field: FormField | null, initialType: string): CreateFormFieldRequest => {
  if (!field) {
    return {
      field_type: (initialType || 'text') as FieldType,
      label: '',
      placeholder: '',
      is_required: false,
      default_value: null,
      validation_rules: {},
      conditional_logic: null,
      order: 0,
      page_number: 1,
      options: isChoiceType(initialType) ? blankOptions() : [],
    };
  }
  return {
    field_type: field.field_type,
    label: field.label,
    placeholder: field.placeholder || '',
    is_required: field.is_required,
    default_value: field.default_value,
    validation_rules: field.validation_rules || {},
    conditional_logic: field.conditional_logic || null,
    order: field.order,
    page_number: field.page_number,
    options: field.fieldOptions?.map((option) => ({ label: option.option_label, value: option.option_value })) || [],
  };
};

const hasExtraSettings = (data: CreateFormFieldRequest): boolean => {
  const rules = Object.values(data.validation_rules || {}).some(
    (value) => value !== null && value !== undefined && value !== '',
  );
  const hasDefault = data.field_type !== 'hidden' && data.default_value != null && data.default_value !== '';
  return rules || hasDefault || !!data.placeholder;
};

export const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  field,
  initialType = 'text',
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  availableFields = [],
  isSaving = false,
}) => {
  // The builder remounts this editor (via `key`) whenever a different field is opened.
  const [fieldData, setFieldData] = useState<CreateFormFieldRequest>(() => initialFieldData(field, initialType));
  const [showMore, setShowMore] = useState(() => hasExtraSettings(initialFieldData(field, initialType)));
  const [error, setError] = useState<string | null>(null);

  const type = fieldData.field_type;
  const typeInfo = fieldTypeInfo(type);
  const isChoice = isChoiceType(type);
  const isHidden = type === 'hidden';
  const rules = fieldData.validation_rules || {};
  const logic = fieldData.conditional_logic || null;
  const parent = conditionParent(logic, availableFields);
  const parentOptions = parent && isChoiceType(parent.field_type) ? parent.fieldOptions || [] : [];

  const update = (patch: Partial<CreateFormFieldRequest>) => {
    setError(null);
    setFieldData((prev) => ({ ...prev, ...patch }));
  };

  const updateRule = (key: keyof ValidationRules, value: string | number | null) => {
    setError(null);
    setFieldData((prev) => ({ ...prev, validation_rules: { ...prev.validation_rules, [key]: value } }));
  };

  const numberRule = (key: keyof ValidationRules, raw: string) =>
    updateRule(key, raw === '' ? null : Number(raw));

  const changeType = (next: FieldType) => {
    update({
      field_type: next,
      options: isChoiceType(next) && !(fieldData.options || []).length ? blankOptions() : fieldData.options,
    });
  };

  const options: OptionDraft[] = fieldData.options || [];

  const setOptionLabel = (index: number, label: string) => {
    update({
      options: options.map((option, i) => {
        if (i !== index) return option;
        // Keep the stored value in step with the label unless it was set to something different on purpose.
        const follows = !option.value || comparable(option.value) === comparable(option.label);
        return { label, value: follows ? label : option.value };
      }),
    });
  };

  const addOption = () => update({ options: [...options, { label: '', value: '' }] });
  const removeOption = (index: number) => update({ options: options.filter((_, i) => i !== index) });

  const setLogic = (next: ConditionalLogic | null) => update({ conditional_logic: next });

  const logicFor = (target: FormField | undefined, current: ConditionalLogic | null): ConditionalLogic => {
    const targetOptions = target && isChoiceType(target.field_type) ? target.fieldOptions || [] : [];
    const currentValue = current?.value ?? '';
    const stillValid = targetOptions.some((option) => option.option_value === String(currentValue));
    return {
      ...(current || {}),
      field_id: target?.id,
      field_key: target?.field_key,
      operator: current?.operator || 'equals',
      value: targetOptions.length > 0 && !stillValid ? targetOptions[0].option_value : currentValue,
    };
  };

  const toggleFollowUp = (enabled: boolean) => {
    if (!enabled) {
      setLogic(null);
      return;
    }
    const preferred = availableFields.find((item) => isChoiceType(item.field_type)) ?? availableFields[0];
    setLogic(logicFor(preferred, null));
  };

  const handleSave = () => {
    const label = fieldData.label.trim();
    if (!label) {
      setError('Add a label so guests know what to answer.');
      return;
    }

    let cleanOptions: OptionDraft[] = [];
    if (isChoice) {
      cleanOptions = options
        .map((option) => ({ label: option.label.trim(), value: (option.value || option.label).trim() }))
        .filter((option) => option.label);
      if (cleanOptions.length === 0) {
        setError('Add at least one option for guests to choose from.');
        return;
      }
      const distinct = new Set(cleanOptions.map((option) => option.value.toLowerCase()));
      if (distinct.size !== cleanOptions.length) {
        setError('Two options are the same. Give each option a different name.');
        return;
      }
    }

    if (logic) {
      if (!parent) {
        setError('Choose which answer this follow-up depends on.');
        return;
      }
      if (operatorNeedsValue(logic.operator) && String(logic.value ?? '').trim() === '') {
        setError('Choose the answer that should show this field.');
        return;
      }
    }

    const cleanRules = Object.fromEntries(
      Object.entries(rules).filter(([, value]) => value !== null && value !== undefined && value !== ''),
    ) as ValidationRules;

    onSave({
      ...fieldData,
      label,
      placeholder: isHidden ? '' : (fieldData.placeholder || '').trim(),
      is_required: isHidden ? false : !!fieldData.is_required,
      default_value: fieldData.default_value === '' ? null : fieldData.default_value,
      validation_rules: cleanRules,
      conditional_logic: logic,
      options: cleanOptions,
    });
  };

  const TypeIcon = typeInfo.icon;
  const showsLength = type === 'text' || type === 'textarea' || type === 'email';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h3 className="truncate text-sm font-semibold">{field ? 'Edit field' : `New ${typeInfo.label.toLowerCase()} field`}</h3>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0" aria-label="Close field editor">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="field-label">{isHidden ? 'Name' : 'Label'}</Label>
          <Input
            id="field-label"
            autoFocus={!field}
            value={fieldData.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder={isHidden ? 'e.g. Campaign source' : 'e.g. Are you bringing a guest?'}
          />
          {!isHidden && <p className="text-xs text-muted-foreground">The question guests see above this field.</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="field-type">Answer type</Label>
          <Select value={type} onValueChange={(value) => changeType(value as FieldType)}>
            <SelectTrigger id="field-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((item) => (
                <SelectItem key={item.type} value={item.type}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{typeInfo.hint}.</p>
        </div>

        {isChoice && (
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => setOptionLabel(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    autoFocus={index > 0 && index === options.length - 1 && option.label === '' && options.length > 2}
                    placeholder={`Option ${index + 1}`}
                    aria-label={`Option ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove option ${index + 1}`}
                    title="Remove option"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-1 h-4 w-4" />
              Add option
            </Button>
          </div>
        )}

        {isHidden ? (
          <div className="space-y-1.5">
            <Label htmlFor="hidden-value">Value</Label>
            <Input
              id="hidden-value"
              value={fieldData.default_value ?? ''}
              onChange={(e) => update({ default_value: e.target.value })}
              placeholder="Saved with every response"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="field-required">Required</Label>
              <p className="text-xs text-muted-foreground">Guests must answer before submitting.</p>
            </div>
            <Switch
              id="field-required"
              checked={!!fieldData.is_required}
              onCheckedChange={(checked) => update({ is_required: checked })}
            />
          </div>
        )}

        <div className="space-y-3 rounded-lg border px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="field-follow-up">Follow-up question</Label>
              <p className="text-xs text-muted-foreground">
                {availableFields.length === 0 && !logic
                  ? 'Add another field first, then show this one based on its answer.'
                  : 'Only show this field when another answer matches.'}
              </p>
            </div>
            <Switch
              id="field-follow-up"
              checked={!!logic}
              disabled={availableFields.length === 0 && !logic}
              onCheckedChange={toggleFollowUp}
            />
          </div>

          {logic && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Show this field when</p>
              <Select
                value={parent ? String(parent.id) : ''}
                onValueChange={(value) =>
                  setLogic(logicFor(availableFields.find((item) => String(item.id) === value), logic))
                }
              >
                <SelectTrigger aria-label="Field to check">
                  <SelectValue placeholder="Choose a field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={logic.operator || 'equals'}
                  onValueChange={(value) => setLogic({ ...logic, operator: value as ConditionalLogic['operator'] })}
                >
                  <SelectTrigger aria-label="Condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {operatorNeedsValue(logic.operator) &&
                  (parentOptions.length > 0 ? (
                    <Select value={String(logic.value ?? '')} onValueChange={(value) => setLogic({ ...logic, value })}>
                      <SelectTrigger aria-label="Answer">
                        <SelectValue placeholder="Choose an answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentOptions.map((option) => (
                          <SelectItem key={option.id ?? option.option_value} value={option.option_value}>
                            {option.option_label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={logic.value ?? ''}
                      onChange={(e) => setLogic({ ...logic, value: e.target.value })}
                      placeholder="Answer to match"
                      aria-label="Answer"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {!isHidden && (
          <div>
            <button
              type="button"
              onClick={() => setShowMore((open) => !open)}
              aria-expanded={showMore}
              className="flex w-full items-center justify-between rounded-md py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              More settings
              <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>

            {showMore && (
              <div className="mt-3 space-y-4">
                {!isChoice && type !== 'file' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="field-placeholder">Hint text</Label>
                    <Input
                      id="field-placeholder"
                      value={fieldData.placeholder || ''}
                      onChange={(e) => update({ placeholder: e.target.value })}
                      placeholder="Shown inside the empty field"
                    />
                  </div>
                )}

                {type !== 'file' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="field-default">Pre-filled answer</Label>
                    {type === 'textarea' ? (
                      <Textarea
                        id="field-default"
                        rows={3}
                        value={fieldData.default_value ?? ''}
                        onChange={(e) => update({ default_value: e.target.value })}
                        placeholder="Leave empty for no default"
                      />
                    ) : (
                      <Input
                        id="field-default"
                        value={fieldData.default_value ?? ''}
                        onChange={(e) => update({ default_value: e.target.value })}
                        placeholder="Leave empty for no default"
                      />
                    )}
                  </div>
                )}

                {showsLength && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="field-min-length">Min characters</Label>
                      <Input
                        id="field-min-length"
                        type="number"
                        min={0}
                        value={rules.min_length ?? ''}
                        onChange={(e) => numberRule('min_length', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="field-max-length">Max characters</Label>
                      <Input
                        id="field-max-length"
                        type="number"
                        min={0}
                        value={rules.max_length ?? ''}
                        onChange={(e) => numberRule('max_length', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {type === 'number' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="field-min-value">Smallest number</Label>
                      <Input
                        id="field-min-value"
                        type="number"
                        value={rules.min_value ?? ''}
                        onChange={(e) => numberRule('min_value', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="field-max-value">Largest number</Label>
                      <Input
                        id="field-max-value"
                        type="number"
                        value={rules.max_value ?? ''}
                        onChange={(e) => numberRule('max_value', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {type === 'file' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="field-file-types">Allowed file types</Label>
                      <Input
                        id="field-file-types"
                        value={rules.accepted_types ?? ''}
                        onChange={(e) => updateRule('accepted_types', e.target.value)}
                        placeholder="image/*, .pdf"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="field-file-size">Max size (MB)</Label>
                      <Input
                        id="field-file-size"
                        type="number"
                        min={0}
                        value={rules.max_size ?? ''}
                        onChange={(e) => numberRule('max_size', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {type === 'email' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="field-pattern">Custom format (regex)</Label>
                    <Input
                      id="field-pattern"
                      value={rules.pattern ?? ''}
                      onChange={(e) => updateRule('pattern', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="field-error-message">Error message</Label>
                  <Input
                    id="field-error-message"
                    value={rules.custom_message ?? ''}
                    onChange={(e) => updateRule('custom_message', e.target.value)}
                    placeholder="Shown when the answer is not valid"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t px-4 py-3">
        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {field ? 'Save changes' : 'Add field'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
        {field && (onDuplicate || onDelete) && (
          <div className="flex items-center justify-between">
            {onDuplicate ? (
              <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} disabled={isSaving} className="text-muted-foreground">
                <Copy className="mr-1.5 h-4 w-4" />
                Duplicate
              </Button>
            ) : (
              <span />
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isSaving}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete field
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormFieldEditor;
