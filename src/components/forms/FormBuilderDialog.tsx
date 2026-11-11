import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FormBuilder from './FormBuilder';

interface FormBuilderDialogProps {
  /** The form being edited, or null when the dialog is closed. */
  form: { id: number; name: string } | null;
  eventId: number;
  onClose: () => void;
}

// Menus and toasts render outside the dialog; clicking them must not close it.
const keepOpen = (event: { target: EventTarget | null; preventDefault: () => void }) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-radix-popper-content-wrapper], [data-sonner-toaster]')) event.preventDefault();
};

/** The form editor, shared by the Forms tab and the Invitations tab. */
export const FormBuilderDialog: React.FC<FormBuilderDialogProps> = ({ form, eventId, onClose }) => {
  const queryClient = useQueryClient();

  const close = () => {
    if (form) void queryClient.invalidateQueries({ queryKey: ['form', form.id] });
    void queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
    void queryClient.invalidateQueries({ queryKey: ['event-form-by-guest-type', eventId] });
    onClose();
  };

  return (
    <Dialog
      modal={false}
      open={form !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="flex h-[90vh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden p-0"
        onPointerDownOutside={keepOpen}
        onInteractOutside={keepOpen}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{form ? `Edit form: ${form.name}` : 'Edit form'}</DialogTitle>
        </DialogHeader>
        {form && <FormBuilder formId={form.id} eventId={eventId} onClose={close} />}
      </DialogContent>
    </Dialog>
  );
};

export default FormBuilderDialog;
