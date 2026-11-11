import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  Eye,
  ListPlus,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernConfirmationDialog } from '@/components/ui/ModernConfirmationDialog';
import { cn } from '@/lib/utils';

import FormFieldPalette from './FormFieldPalette';
import FormFieldEditor from './FormFieldEditor';
import FormPreview from './FormPreview';
import BadgeFieldMapper from './BadgeFieldMapper';
import { conditionParent, describeCondition, fieldTypeInfo, isChoiceType } from './fieldTypes';

import { formApi, formFieldApi } from '@/lib/api/forms';
import type { CreateFormFieldRequest, FieldType, Form, FormField } from '@/types/forms';

interface FormBuilderProps {
  formId: number;
  eventId: number;
  /** Called when the organizer is finished. Every change is already saved by then. */
  onClose?: () => void;
}

type View = 'fields' | 'preview' | 'badges';

type Panel =
  | { mode: 'idle' }
  | { mode: 'pick' }
  | { mode: 'add'; type: FieldType }
  | { mode: 'edit'; fieldId: number };

const VIEWS: { key: View; label: string; icon: typeof Eye }[] = [
  { key: 'fields', label: 'Fields', icon: ListPlus },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'badges', label: 'Badge mapping', icon: Tag },
];

const errorText = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: string; error?: string; errors?: Record<string, string[]> } } })
    ?.response?.data;
  return data?.message || data?.error || Object.values(data?.errors ?? {}).flat()[0] || fallback;
};

/** Field endpoints return Laravel's snake_case relations. */
const normalizeField = (field: FormField): FormField => {
  const raw = field as FormField & {
    field_options?: FormField['fieldOptions'];
    badge_mappings?: FormField['badgeMappings'];
  };
  return {
    ...field,
    fieldOptions: field.fieldOptions || raw.field_options || [],
    badgeMappings: field.badgeMappings || raw.badge_mappings || [],
  };
};

const toRequest = (field: FormField): CreateFormFieldRequest => ({
  field_type: field.field_type,
  label: field.label,
  placeholder: field.placeholder,
  is_required: field.is_required,
  default_value: field.default_value,
  validation_rules: field.validation_rules,
  conditional_logic: field.conditional_logic,
  order: field.order,
  page_number: field.page_number,
  options: field.fieldOptions?.map((option) => ({ label: option.option_label, value: option.option_value })) || [],
});

/**
 * Options whose stored value changed because the organizer renamed them.
 * Only a pure rename counts: adding or removing options is never treated as one.
 */
const renamedOptionValues = (before: FormField, after: CreateFormFieldRequest): Map<string, string> => {
  const renamed = new Map<string, string>();
  const previous = before.fieldOptions ?? [];
  const next = after.options ?? [];
  if (previous.length !== next.length) return renamed;
  previous.forEach((option, index) => {
    const replacement = next[index].value;
    if (replacement === option.option_value) return;
    const reused = previous.some((item) => item.option_value === replacement);
    const kept = next.some((item) => item.value === option.option_value);
    if (!reused && !kept) renamed.set(option.option_value, replacement);
  });
  return renamed;
};

export const FormBuilder: React.FC<FormBuilderProps> = ({ formId, eventId, onClose }) => {
  const queryClient = useQueryClient();
  const formKey = useMemo(() => ['form', formId], [formId]);

  const [view, setView] = useState<View>('fields');
  const [panel, setPanel] = useState<Panel>({ mode: 'idle' });
  const [fieldToDelete, setFieldToDelete] = useState<FormField | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const { data: form, isLoading, error: formError } = useQuery({
    queryKey: formKey,
    queryFn: () => formApi.getForm(formId),
    enabled: !!formId,
    retry: 1,
  });

  // The query cache is the single source of truth, so the preview and badge mapping stay in step.
  const fields = useMemo(
    () => [...(form?.formFields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [form],
  );

  const setCachedFields = (updater: (current: FormField[]) => FormField[]) => {
    queryClient.setQueryData<Form>(formKey, (current) =>
      current ? { ...current, formFields: updater(current.formFields ?? []) } : current,
    );
  };

  const refreshLists = () => {
    void queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
    void queryClient.invalidateQueries({ queryKey: ['event-form-by-guest-type', eventId] });
  };

  const createFieldMutation = useMutation({
    mutationFn: async (data: CreateFormFieldRequest) => normalizeField(await formFieldApi.createField(formId, data)),
    onSuccess: (created) => {
      setCachedFields((current) => [...current, created]);
      refreshLists();
    },
    onError: (error) => toast.error(errorText(error, 'Could not add the field.')),
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ field, data }: { field: FormField; data: CreateFormFieldRequest }) => {
      const changed = [normalizeField(await formFieldApi.updateField(formId, field.id, data))];

      // Keep follow-up questions pointing at an answer that was just renamed.
      const renamed = renamedOptionValues(field, data);
      if (renamed.size > 0) {
        for (const other of fields) {
          const logic = other.conditional_logic;
          if (other.id === field.id || !logic || conditionParent(logic, [field])?.id !== field.id) continue;
          const replacement = renamed.get(String(logic.value ?? ''));
          if (replacement === undefined) continue;
          changed.push(
            normalizeField(
              await formFieldApi.updateField(formId, other.id, {
                field_type: other.field_type,
                label: other.label,
                conditional_logic: { ...logic, value: replacement },
              }),
            ),
          );
        }
      }
      return changed;
    },
    onSuccess: (changed) => {
      setCachedFields((current) => current.map((item) => changed.find((next) => next.id === item.id) ?? item));
      setPanel({ mode: 'idle' });
    },
    onError: (error) => {
      toast.error(errorText(error, 'Could not save the field.'));
      void queryClient.invalidateQueries({ queryKey: formKey });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: number) => formFieldApi.deleteField(formId, fieldId),
    onSuccess: (_, fieldId) => {
      setFieldToDelete(null);
      setCachedFields((current) => current.filter((item) => item.id !== fieldId));
      setPanel((current) => (current.mode === 'edit' && current.fieldId === fieldId ? { mode: 'idle' } : current));
      refreshLists();
    },
    onError: (error) => toast.error(errorText(error, 'Could not delete the field.')),
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: (fieldIds: number[]) => formFieldApi.reorderFields(formId, fieldIds),
    onError: (error) => {
      toast.error(errorText(error, 'Could not save the new order.'));
      void queryClient.invalidateQueries({ queryKey: formKey });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => formApi.updateForm(formId, { name }),
    onSuccess: (_, name) => {
      queryClient.setQueryData<Form>(formKey, (current) => (current ? { ...current, name } : current));
      refreshLists();
    },
    onError: (error) => toast.error(errorText(error, 'Could not rename the form.')),
  });

  const nextOrder = fields.reduce((highest, item) => Math.max(highest, item.order ?? 0), 0) + 1;
  const editingField = panel.mode === 'edit' ? fields.find((item) => item.id === panel.fieldId) ?? null : null;
  const isSaving = createFieldMutation.isPending || updateFieldMutation.isPending;

  const handleFieldSave = (data: CreateFormFieldRequest) => {
    if (editingField) {
      updateFieldMutation.mutate({ field: editingField, data });
      return;
    }
    createFieldMutation.mutate({ ...data, order: nextOrder }, { onSuccess: () => setPanel({ mode: 'idle' }) });
  };

  const handleDuplicate = (field: FormField) => {
    createFieldMutation.mutate(
      { ...toRequest(field), label: `${field.label} (copy)`, order: nextOrder },
      { onSuccess: (created) => setPanel({ mode: 'edit', fieldId: created.id }) },
    );
  };

  const moveField = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const reordered = [...fields];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const withOrder = reordered.map((item, position) => ({ ...item, order: position + 1 }));
    setCachedFields(() => withOrder);
    reorderFieldsMutation.mutate(withOrder.map((item) => item.id));
  };

  const commitRename = () => {
    if (nameDraft === null || renameMutation.isPending) return;
    const name = nameDraft.trim();
    setNameDraft(null);
    if (name && form && name !== form.name) renameMutation.mutate(name);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading form…
      </div>
    );
  }

  if (formError || !form) {
    const status = (formError as { response?: { status?: number } } | null)?.response?.status;
    return (
      <div className="flex h-full flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <p className="font-semibold">This form could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === 404
              ? 'It may have been deleted, or you may not have access to it.'
              : errorText(formError, 'Check your connection and try again.')}
          </p>
          {onClose && (
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  const guestTypeName = form.guest_type?.name;
  const deleteDependents = fieldToDelete
    ? fields.filter(
        (item) => item.id !== fieldToDelete.id && !!conditionParent(item.conditional_logic, [fieldToDelete]),
      ).length
    : 0;
  const panelOpen = panel.mode !== 'idle';
  const showsPicker = panel.mode === 'idle' || panel.mode === 'pick';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3 pr-14">
        <div className="min-w-0">
          {nameDraft !== null ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                commitRename();
              }}
            >
              <Input
                autoFocus
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitRename}
                maxLength={255}
                aria-label="Form name"
                className="h-9 w-72 max-w-full text-base font-semibold"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setNameDraft(form.name)}
              title="Rename form"
              className="group flex max-w-full items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate text-lg font-semibold">{form.name}</span>
              <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {guestTypeName ? `For ${guestTypeName} · ` : ''}
            {fields.length} field{fields.length === 1 ? '' : 's'} · Changes save automatically
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Form views" className="inline-flex rounded-lg border bg-muted p-0.5">
            {VIEWS.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(item.key)}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {onClose && <Button onClick={onClose}>Done</Button>}
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {view === 'badges' ? (
          <div className="flex-1 overflow-auto p-4">
            <BadgeFieldMapper formId={formId} />
          </div>
        ) : view === 'preview' ? (
          <div className="min-h-0 flex-1">
            <FormPreview formData={form} fields={fields} onClose={() => setView('fields')} />
          </div>
        ) : (
          <>
            {/* Field list */}
            <div className={cn('min-h-0 flex-1 overflow-y-auto bg-muted/20 p-5', panelOpen && 'hidden lg:block')}>
              <div className="mx-auto max-w-2xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Fields</h3>
                    <p className="text-xs text-muted-foreground">
                      Guests answer these in order. Select a field to edit it.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPanel({ mode: 'pick' })}
                    className={cn(showsPicker && 'lg:hidden')}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add field
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-background px-6 py-12 text-center">
                    <ListPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">No fields yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="hidden lg:inline">Choose a field type on the right to add your first question.</span>
                      <span className="lg:hidden">Add your first question to get started.</span>
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {fields.map((field, index) => {
                      const info = fieldTypeInfo(field.field_type);
                      const Icon = info.icon;
                      const selected = panel.mode === 'edit' && panel.fieldId === field.id;
                      const condition = describeCondition(field.conditional_logic, fields);
                      const optionLabels = isChoiceType(field.field_type)
                        ? (field.fieldOptions ?? []).map((option) => option.option_label)
                        : [];
                      const mapped = field.badgeMappings?.length ?? 0;
                      const open = () => setPanel({ mode: 'edit', fieldId: field.id });

                      return (
                        <li key={field.id}>
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Edit ${field.label}`}
                            aria-pressed={selected}
                            onClick={open}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                open();
                              }
                            }}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              selected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40',
                            )}
                          >
                            <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
                              {index + 1}
                            </span>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">{field.label}</span>
                                {field.is_required && (
                                  <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                    Required
                                  </span>
                                )}
                                {mapped > 0 && (
                                  <span
                                    className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
                                    title={`Mapped to ${mapped} badge placeholder${mapped === 1 ? '' : 's'}`}
                                  >
                                    <Tag className="h-3 w-3" />
                                    {mapped}
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {info.label}
                                {optionLabels.length > 0 && ` · ${optionLabels.join(', ')}`}
                              </p>
                              {condition && (
                                <p
                                  className={cn(
                                    'mt-0.5 flex items-center gap-1 truncate text-xs',
                                    conditionParent(field.conditional_logic, fields) ? 'text-primary' : 'text-destructive',
                                  )}
                                >
                                  <CornerDownRight className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{condition}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                aria-label={`Move ${field.label} up`}
                                title="Move up"
                                disabled={index === 0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveField(index, -1);
                                }}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                aria-label={`Move ${field.label} down`}
                                title="Move down"
                                disabled={index === fields.length - 1}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveField(index, 1);
                                }}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                aria-label={`Delete ${field.label}`}
                                title="Delete field"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setFieldToDelete(field);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>

            {/* Side panel: add a field, or edit the selected one */}
            <aside
              className={cn(
                'min-h-0 flex-1 flex-col border-l bg-background lg:flex lg:w-96 lg:flex-none',
                panelOpen ? 'flex' : 'hidden',
              )}
            >
              {panel.mode === 'add' || editingField ? (
                <FormFieldEditor
                  key={editingField ? `edit-${editingField.id}` : `add-${panel.mode === 'add' ? panel.type : ''}`}
                  field={editingField}
                  initialType={panel.mode === 'add' ? panel.type : undefined}
                  onSave={handleFieldSave}
                  onCancel={() => setPanel({ mode: 'idle' })}
                  onDelete={editingField ? () => setFieldToDelete(editingField) : undefined}
                  onDuplicate={editingField ? () => handleDuplicate(editingField) : undefined}
                  availableFields={fields.filter((item) => item.id !== editingField?.id)}
                  isSaving={isSaving}
                />
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">Add a field</h3>
                      <p className="text-xs text-muted-foreground">Choose the kind of answer you need.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setPanel({ mode: 'idle' })}
                    >
                      Back
                    </Button>
                  </div>
                  <FormFieldPalette onFieldSelect={(type) => setPanel({ mode: 'add', type })} />
                </div>
              )}
            </aside>
          </>
        )}
      </div>

      <ModernConfirmationDialog
        isOpen={!!fieldToDelete}
        onClose={() => {
          if (!deleteFieldMutation.isPending) setFieldToDelete(null);
        }}
        onConfirm={() => {
          if (fieldToDelete) deleteFieldMutation.mutate(fieldToDelete.id);
        }}
        title="Delete field"
        description={
          fieldToDelete
            ? `Remove “${fieldToDelete.label}” from this form? Guests will no longer see this question.${
                deleteDependents > 0
                  ? ` ${deleteDependents} follow-up question${deleteDependents === 1 ? ' depends' : 's depend'} on its answer and will need updating.`
                  : ''
              }`
            : undefined
        }
        confirmText="Delete field"
        cancelText="Keep field"
        variant="danger"
        isLoading={deleteFieldMutation.isPending}
      />
    </div>
  );
};

export default FormBuilder;
