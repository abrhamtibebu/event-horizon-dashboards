import type { FormField } from '@/types/forms';

type FieldOption = { option_value?: string; option_label?: string };

function optionsOf(field?: FormField | null): FieldOption[] {
  if (!field) return [];
  const options = field.fieldOptions || (field as FormField & { field_options?: FieldOption[] }).field_options;
  return Array.isArray(options) ? options : [];
}

function answerMatches(parent: FormField | undefined, actual: unknown, expected: unknown): boolean {
  const actualText = String(actual ?? '').trim().toLowerCase();
  const expectedText = String(expected ?? '').trim().toLowerCase();
  if (actualText === expectedText) return true;
  return optionsOf(parent).some((option) => {
    const value = String(option.option_value ?? '').trim().toLowerCase();
    const label = String(option.option_label ?? '').trim().toLowerCase();
    const selected = actualText === value || actualText === label;
    const target = expectedText === value || expectedText === label;
    return selected && target;
  });
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function hasAnswer(value: unknown): boolean {
  return asList(value).some((item) => item !== undefined && item !== null && String(item).trim() !== '');
}

/** True when a follow-up field should be shown for the current answers. */
export function evaluateFieldCondition(logic: unknown, formData: Record<string, unknown>, fields: FormField[]): boolean {
  if (!logic || typeof logic !== 'object' || Object.keys(logic as object).length === 0) return true;
  const rule = logic as { field_id?: number | string; field_key?: string; operator?: string; value?: unknown };
  const parent = fields.find((field) =>
    (rule.field_id != null && String(field.id) === String(rule.field_id)) ||
    (rule.field_key != null && field.field_key === rule.field_key)
  );
  const key = parent?.field_key || rule.field_key;
  if (!key) return true;
  const fieldValue = formData[key];
  const values = asList(fieldValue);

  switch (rule.operator) {
    case 'equals':
      return values.some((item) => answerMatches(parent, item, rule.value));
    case 'not_equals':
      return !values.some((item) => answerMatches(parent, item, rule.value));
    case 'contains':
      return values.some((item) => String(item ?? '').toLowerCase().includes(String(rule.value ?? '').toLowerCase()));
    case 'greater_than':
      return Number(fieldValue) > Number(rule.value);
    case 'less_than':
      return Number(fieldValue) < Number(rule.value);
    case 'is_empty':
      return !hasAnswer(fieldValue);
    case 'is_not_empty':
      return hasAnswer(fieldValue);
    default:
      return true;
  }
}
