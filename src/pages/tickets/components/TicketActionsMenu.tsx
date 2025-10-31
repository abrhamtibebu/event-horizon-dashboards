import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Power, PowerOff, BarChart, Trash } from 'lucide-react';
import { deleteTicketType, updateTicketType } from '@/lib/api/tickets';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { TicketType } from '@/types';

interface TicketActionsMenuProps {
  ticketType: TicketType;
  onEdit: () => void;
  eventId: number;
}

export function TicketActionsMenu({ ticketType, onEdit, eventId }: TicketActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const toggleActiveMutation = useMutation({
    mutationFn: () =>
      updateTicketType(ticketType.id, { is_active: !ticketType.is_active }),
    onSuccess: () => {
      toast.success(
        `Ticket type ${ticketType.is_active ? 'deactivated' : 'activated'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ['ticket-types', eventId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update ticket type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicketType(ticketType.id),
    onSuccess: () => {
      toast.success('Ticket type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['ticket-types', eventId] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete ticket type');
      setShowDeleteDialog(false);
    },
  });

  const handleViewSales = () => {
    navigate(`/dashboard/ticket-analytics/${eventId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => toggleActiveMutation.mutate()}>
            {ticketType.is_active ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleViewSales}>
            <BarChart className="w-4 h-4 mr-2" />
            View Sales Report
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
            disabled={ticketType.sold_count > 0}
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{ticketType.name}"? This action cannot be undone.
              {ticketType.sold_count > 0 && (
                <span className="block mt-2 text-destructive font-semibold">
                  This ticket type has {ticketType.sold_count} sold tickets and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

