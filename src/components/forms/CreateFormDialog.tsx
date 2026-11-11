import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formApi, formFieldApi } from '@/lib/api/forms';
import type { FieldType, Form } from '@/types/forms';

interface FormAudience {
  id: number;
  name: string;
}

interface CreateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  /** Guest types (or ticket types) a form can be created for. */
  types: FormAudience[];
  /** "Guest type" or "Ticket type". */
  typeLabel?: string;
  /** Types that already have a form. Each type can have one. */
  takenTypeIds?: number[];
  defaultTypeId?: number | null;
  /** Fix the type to `defaultTypeId`, for flows that already chose it. */
  lockType?: boolean;
  /** Make the form live immediately instead of leaving it as a draft. */
  activate?: boolean;
  onCreated: (form: Form) => void;
  /** Called with the existing form when the chosen type turns out to have one already. */
  onExisting?: (form: Form) => void;
}

const STARTER_FIELDS: { key: string; label: string; type: FieldType; required: boolean; preselected: boolean }[] = [
  { key: 'name', label: 'Full name', type: 'text', required: true, preselected: true },
  { key: 'email', label: 'Email', type: 'email', required: true, preselected: true },
  { key: 'phone', label: 'Phone number', type: 'phone', required: false, preselected: true },
  { key: 'company', label: 'Company', type: 'text', required: false, preselected: false },
  { key: 'job', label: 'Job title', type: 'text', required: false, preselected: false },
];

const errorText = (error: unknown): string => {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  return String(data?.message || data?.error || '');
};

type BodyProps = Omit<CreateFormDialogProps, 'open'> & { setBusy: (busy: boolean) => void };

const CreateFormBody: React.FC<BodyProps> = ({
  onOpenChange,
  eventId,
  types,
  typeLabel = 'Guest type',
  takenTypeIds = [],
  defaultTypeId = null,
  lockType = false,
  activate = false,
  onCreated,
  onExisting,
  setBusy,
}) => {
  const queryClient = useQueryClient();
  const freeTypes = types.filter((item) => !takenTypeIds.includes(item.id));
  const suggestedName = (id: number | null) => {
    const match = types.find((item) => item.id === id);
    return match ? `${match.name} form` : '';
  };

  const [typeId, setTypeId] = useState<number | null>(
    () => defaultTypeId ?? (freeTypes.length === 1 ? freeTypes[0].id : null),
  );
  const [name, setName] = useState(() => suggestedName(typeId));
  const [nameEdited, setNameEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [starters, setStarters] = useState<string[]>(() =>
    STARTER_FIELDS.filter((item) => item.preselected).map((item) => item.key),
  );
  const [creating, setCreating] = useState(false);

  const selectedType = types.find((item) => item.id === typeId) ?? null;
  const typeWord = typeLabel.toLowerCase();
  const canCreate = !!selectedType && name.trim().length > 0 && !creating;

  const chooseType = (id: number) => {
    setTypeId(id);
    if (!nameEdited) setName(suggestedName(id));
  };

  const toggleStarter = (key: string) =>
    setStarters((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));

  const refreshLists = () => {
    void queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
    void queryClient.invalidateQueries({ queryKey: ['event-form-by-guest-type', eventId] });
  };

  const create = async () => {
    if (!selectedType || !canCreate) return;
    setCreating(true);
    setBusy(true);
    try {
      let form = await formApi.createForm(eventId, {
        event_id: eventId,
        name: name.trim(),
        description: description.trim() || undefined,
        guest_type_id: selectedType.id,
        ...(activate ? { status: 'active' as const } : {}),
      });
      if (activate && form.status !== 'active') {
        form = await formApi.activateForm(form.id);
      }

      // One at a time so the fields keep this order.
      const chosen = STARTER_FIELDS.filter((item) => starters.includes(item.key));
      let failed = 0;
      for (let index = 0; index < chosen.length; index += 1) {
        const starter = chosen[index];
        try {
          await formFieldApi.createField(form.id, {
            field_type: starter.type,
            label: starter.label,
            is_required: starter.required,
            order: index + 1,
            page_number: 1,
          });
        } catch {
          failed += 1;
        }
      }

      refreshLists();
      if (failed > 0) {
        toast.warning('The form was created, but some starter fields could not be added. Add them in the editor.');
      } else {
        toast.success('Form created. Add or adjust its fields.');
      }
      onCreated(form);
    } catch (error: unknown) {
      const message = errorText(error);
      if (message.includes('already exists')) {
        try {
          const existing = await formApi.getFormByGuestType(eventId, selectedType.id);
          refreshLists();
          if (onExisting) {
            toast.info(`This ${typeWord} already has a form. Opening it to edit.`);
            onExisting(existing);
            return;
          }
        } catch {
          // Fall through to the error below.
        }
      }
      toast.error(message || 'Could not create the form.');
    } finally {
      setCreating(false);
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void create();
      }}
    >
      <DialogHeader>
        <DialogTitle>Create a form</DialogTitle>
        <DialogDescription>
          Choose who fills it in and what to ask first. You can add, edit and reorder fields in the next step.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="create-form-type">{typeLabel}</Label>
          {lockType && selectedType ? (
            <p id="create-form-type" className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium">
              {selectedType.name}
            </p>
          ) : (
            <Select value={typeId ? String(typeId) : ''} onValueChange={(value) => chooseType(Number(value))}>
              <SelectTrigger id="create-form-type">
                <SelectValue placeholder={`Choose a ${typeWord}`} />
              </SelectTrigger>
              <SelectContent>
                {types.map((item) => {
                  const taken = takenTypeIds.includes(item.id);
                  return (
                    <SelectItem key={item.id} value={String(item.id)} disabled={taken}>
                      {item.name}
                      {taken ? ' · already has a form' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          {types.length === 0 ? (
            <p className="text-xs text-amber-600">This event has no {typeWord}s yet. Add one first.</p>
          ) : freeTypes.length === 0 && !lockType ? (
            <p className="text-xs text-amber-600">
              Every {typeWord} already has a form. Edit an existing form instead.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Each {typeWord} has one form.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-form-name">Form name</Label>
          <Input
            id="create-form-name"
            value={name}
            maxLength={255}
            onChange={(event) => {
              setName(event.target.value);
              setNameEdited(true);
            }}
            placeholder="e.g. VIP form"
          />
        </div>

        <div className="space-y-2">
          <div>
            <Label>Start with</Label>
            <p className="text-xs text-muted-foreground">Common fields to add now. You can change them later.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STARTER_FIELDS.map((item) => {
              const selected = starters.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleStarter(item.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-form-description">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="create-form-description"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A short note shown with the form"
          />
        </div>
      </div>

      <DialogFooter className="items-center gap-2 sm:justify-between sm:space-x-0">
        <p className="text-xs text-muted-foreground">
          {activate ? 'The form goes live as soon as it is created.' : 'New forms start as drafts until you activate them.'}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canCreate}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {creating ? 'Creating…' : 'Create form'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};

/** One-step form creation, shared by the Forms tab and the Invitations tab. */
export const CreateFormDialog: React.FC<CreateFormDialogProps> = ({ open, onOpenChange, ...rest }) => {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return;
        onOpenChange(next);
      }}
    >
      {/* Radix unmounts the content when closed, so every open starts from a clean state. */}
      <DialogContent className="max-w-lg">
        <CreateFormBody {...rest} onOpenChange={onOpenChange} setBusy={setBusy} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateFormDialog;
