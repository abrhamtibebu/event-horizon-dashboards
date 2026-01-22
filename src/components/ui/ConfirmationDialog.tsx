import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />,
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          iconBg: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
          confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
          iconBg: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
        };
      case 'info':
        return {
          icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          iconBg: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />,
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
          iconBg: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6 text-muted-foreground" />,
          confirmButton: 'bg-primary hover:bg-primary/90 text-primary-foreground',
          iconBg: 'bg-muted',
          borderColor: 'border-border',
        };
    }
  };

  const styles = getVariantStyles();
  const displayIcon = icon || styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4 border-b border-border/50">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} ${styles.borderColor} border-2 mb-4`}>
            {displayIcon}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto order-1 sm:order-2 ${styles.confirmButton}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {variant === 'danger' && <Trash2 className="h-4 w-4 mr-2" />}
                {variant === 'warning' && <AlertTriangle className="h-4 w-4 mr-2" />}
                {variant === 'info' && <Info className="h-4 w-4 mr-2" />}
                {variant === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialized dialog components for common use cases
export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone and will permanently remove all associated data.`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function HardDeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'vendor',
  constraints,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  constraints?: {
    active_quotations?: number;
    pending_payments?: number;
    active_deliveries?: number;
  };
  isLoading?: boolean;
}) {
  const hasConstraints = constraints && (
    (constraints.active_quotations && constraints.active_quotations > 0) ||
    (constraints.pending_payments && constraints.pending_payments > 0) ||
    (constraints.active_deliveries && constraints.active_deliveries > 0)
  );

  const getDescription = () => {
    if (hasConstraints) {
      const issues = [];
      if (constraints.active_quotations && constraints.active_quotations > 0) {
        issues.push(`${constraints.active_quotations} active quotation${constraints.active_quotations > 1 ? 's' : ''}`);
      }
      if (constraints.pending_payments && constraints.pending_payments > 0) {
        issues.push(`${constraints.pending_payments} pending payment${constraints.pending_payments > 1 ? 's' : ''}`);
      }
      if (constraints.active_deliveries && constraints.active_deliveries > 0) {
        issues.push(`${constraints.active_deliveries} active deliver${constraints.active_deliveries > 1 ? 'ies' : 'y'}`);
      }
      
      return `This ${itemType} has ${issues.join(', ')}. Hard delete will permanently remove "${itemName}" and ALL associated data including quotations, payments, and deliveries. This action cannot be undone.`;
    }
    
    return `Are you sure you want to permanently delete "${itemName}"? This action cannot be undone and will remove all associated data.`;
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Hard Delete ${itemType}`}
      description={getDescription()}
      confirmText="Hard Delete"
      cancelText="Cancel"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function StatusChangeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  currentStatus,
  newStatus,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  currentStatus: string;
  newStatus: string;
  isLoading?: boolean;
}) {
  const getVariant = () => {
    if (newStatus === 'active' || newStatus === 'approved') return 'success';
    if (newStatus === 'suspended' || newStatus === 'rejected') return 'warning';
    return 'info';
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Change Status"
      description={`Are you sure you want to change the status of "${itemName}" from "${currentStatus}" to "${newStatus}"?`}
      confirmText="Change Status"
      cancelText="Cancel"
      variant={getVariant()}
      isLoading={isLoading}
    />
  );
}














