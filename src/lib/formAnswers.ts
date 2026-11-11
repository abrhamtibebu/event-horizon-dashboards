import type { FormField } from '@/types/forms';

export interface DisplayedAnswer {
  key: string;
  label: string;
  value: string;
  followUp: boolean;
}

type LooseOption = {
  option_value?: string;
  option_label?: string;
  value?: string;
  label?: string;
};

function optionsOf(field?: FormField | null): Array<{ value: string; label: string }> {
  if (!field) return [];
  const raw = field as FormField & { field_options?: LooseOption[]; options?: LooseOption[] };
  const options = field.fieldOptions || raw.field_options || raw.options || [];
  return options.map((option) => ({
    value: String(option.option_value ?? option.value ?? ''),
    label: String(option.option_label ?? option.label ?? ''),
  }));
}

function labelFor(field: FormField | undefined, raw: unknown): string {
  const text = typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw ?? '').trim();
  const match = optionsOf(field).find((option) =>
    text !== '' && (option.value.toLowerCase() === text.toLowerCase() || option.label.toLowerCase() === text.toLowerCase())
  );
  return match && match.label !== '' ? match.label : text;
}

/** The words a guest would recognize for a stored answer, including a chosen option's name. */
export function readableAnswer(field: FormField | undefined, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => labelFor(field, item)).filter((item) => item !== '').join(', ');
  }
  return labelFor(field, value);
}

function blank(value: unknown): boolean {
  if (value == null || value === '') return true;
  if (!Array.isArray(value)) return false;
  return value.every((item) => item == null || String(item).trim() === '');
}

function isFollowUp(field: FormField): boolean {
  const logic = field.conditional_logic as unknown;
  if (!logic) return false;
  if (typeof logic === 'string') return logic.trim() !== '' && logic.trim() !== '{}';
  return typeof logic === 'object' && Object.keys(logic as object).length > 0;
}

/**
 * Form questions in the order the guest saw them.
 * A follow-up is included only when the guest answered it.
 */
export function displayedAnswers(fields: FormField[], data: Record<string, unknown> | null | undefined): DisplayedAnswer[] {
  const answers = data ?? {};
  const ordered = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const seen = new Set<string>();
  const rows: DisplayedAnswer[] = [];

  for (const field of ordered) {
    seen.add(field.field_key);
    const value = answers[field.field_key] ?? answers[String(field.id)];
    if (blank(value)) continue;
    rows.push({
      key: field.field_key || String(field.id),
      label: field.label,
      value: readableAnswer(field, value),
      followUp: isFollowUp(field),
    });
  }

  for (const [key, value] of Object.entries(answers)) {
    if (seen.has(key) || blank(value)) continue;
    rows.push({
      key,
      label: key.replace(/_/g, ' '),
      value: readableAnswer(undefined, value),
      followUp: false,
    });
  }

  return rows;
}
