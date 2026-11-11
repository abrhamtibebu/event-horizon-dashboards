import {
  AlignLeft,
  Calendar,
  CalendarClock,
  CircleDot,
  EyeOff,
  Hash,
  List,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  Type,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import type { ConditionalLogic, FieldType, FormField } from '@/types/forms';

export interface FieldTypeInfo {
  type: FieldType;
  label: string;
  hint: string;
  icon: LucideIcon;
  group: 'text' | 'choice' | 'other';
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  { type: 'text', label: 'Short answer', hint: 'One line, such as a name or title', icon: Type, group: 'text' },
  { type: 'textarea', label: 'Long answer', hint: 'Several lines, such as notes or comments', icon: AlignLeft, group: 'text' },
  { type: 'email', label: 'Email', hint: 'Checks for a valid email address', icon: Mail, group: 'text' },
  { type: 'phone', label: 'Phone number', hint: 'Accepts +251, 09 and 9 formats', icon: Phone, group: 'text' },
  { type: 'number', label: 'Number', hint: 'Digits only', icon: Hash, group: 'text' },
  { type: 'radio', label: 'Single choice', hint: 'Guests pick one option, such as Yes or No', icon: CircleDot, group: 'choice' },
  { type: 'checkbox', label: 'Multiple choice', hint: 'Guests pick every option that applies', icon: ListChecks, group: 'choice' },
  { type: 'select', label: 'Dropdown', hint: 'Guests pick one option from a list', icon: List, group: 'choice' },
  { type: 'date', label: 'Date', hint: 'A calendar date', icon: Calendar, group: 'other' },
  { type: 'datetime', label: 'Date & time', hint: 'A date with a time', icon: CalendarClock, group: 'other' },
  { type: 'address', label: 'Address', hint: 'A full postal address', icon: MapPin, group: 'other' },
  { type: 'file', label: 'File upload', hint: 'Guests attach a document or image', icon: Upload, group: 'other' },
  { type: 'hidden', label: 'Hidden value', hint: 'Saved with each response, not shown to guests', icon: EyeOff, group: 'other' },
];

export const FIELD_TYPE_GROUPS: { key: FieldTypeInfo['group']; label: string }[] = [
  { key: 'text', label: 'Text & contact' },
  { key: 'choice', label: 'Choices' },
  { key: 'other', label: 'More' },
];

export const fieldTypeInfo = (type: string): FieldTypeInfo =>
  FIELD_TYPES.find((item) => item.type === type) ?? FIELD_TYPES[0];

export const isChoiceType = (type: string): boolean =>
  type === 'radio' || type === 'checkbox' || type === 'select';

export const CONDITION_OPERATORS: { value: NonNullable<ConditionalLogic['operator']>; label: string }[] = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'is_not_empty', label: 'is answered' },
  { value: 'is_empty', label: 'is left empty' },
];

export const operatorNeedsValue = (operator?: string): boolean =>
  operator !== 'is_empty' && operator !== 'is_not_empty';

/** The field a follow-up condition depends on, if it is still in the form. */
export const conditionParent = (
  logic: ConditionalLogic | null | undefined,
  fields: FormField[],
): FormField | undefined => {
  if (!logic) return undefined;
  return (
    fields.find((item) => logic.field_id != null && String(item.id) === String(logic.field_id)) ??
    fields.find((item) => !!logic.field_key && item.field_key === logic.field_key)
  );
};

/** Plain-language summary such as: Shown when "Bringing a guest?" is Yes */
export const describeCondition = (
  logic: ConditionalLogic | null | undefined,
  fields: FormField[],
): string | null => {
  if (!logic) return null;
  const parent = conditionParent(logic, fields);
  if (!parent) return 'Depends on a field that was removed';
  const operator = CONDITION_OPERATORS.find((item) => item.value === (logic.operator ?? 'equals'));
  const base = `Shown when “${parent.label}” ${operator?.label ?? 'is'}`;
  if (!operatorNeedsValue(logic.operator)) return base;
  const option = parent.fieldOptions?.find((item) => item.option_value === String(logic.value ?? ''));
  return `${base} ${option?.option_label ?? String(logic.value ?? '')}`.trim();
};
