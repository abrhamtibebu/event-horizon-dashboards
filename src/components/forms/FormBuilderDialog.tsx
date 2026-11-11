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

// The editor must stay open while a field, menu, or confirmation inside it is used.
// Those controls render outside the dialog, and the non-modal dialog treats that as a
// click away and closes. Closing is explicit: Done, the X button, or Escape.
const keepOpen = (event: { preventDefault: () => void }) => {
  event.preventDefault();
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
        className="z-[80] flex h-[90vh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          // Take focus only after the control that opened the editor has finished,
          // so its focus return is not treated as leaving the dialog.
          event.preventDefault();
          const content = event.currentTarget as HTMLElement | null;
          window.setTimeout(() => {
            if (!content?.isConnected) return;
            content.querySelector<HTMLElement>('button, a[href], input, select, textarea')?.focus();
          }, 0);
        }}
        onPointerDownOutside={keepOpen}
        onFocusOutside={keepOpen}
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
