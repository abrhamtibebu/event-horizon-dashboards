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
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  CheckCircle, 
  Info, 
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Heart
} from 'lucide-react';

interface ModernConfirmationDialogProps {
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

export function ModernConfirmationDialog({
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
}: ModernConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: (
            <div className="relative">
              <Trash2 className="h-8 w-8 text-destructive animate-pulse" />
              <Zap className="h-4 w-4 text-destructive/80 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20',
          iconBg: 'bg-destructive/10 dark:bg-destructive/20',
          borderColor: 'border-destructive/30',
          glowColor: 'shadow-destructive/20',
        };
      case 'warning':
        return {
          icon: (
            <div className="relative">
              <AlertTriangle className="h-8 w-8 text-[hsl(var(--color-warning))] animate-pulse" />
              <Shield className="h-4 w-4 text-[hsl(var(--color-warning))]/80 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-[hsl(var(--color-warning))] hover:bg-[hsl(var(--color-warning))]/90 text-[hsl(var(--color-rich-black))] shadow-lg shadow-[hsl(var(--color-warning))]/20',
          iconBg: 'bg-[hsl(var(--color-warning))]/10 dark:bg-[hsl(var(--color-warning))]/20',
          borderColor: 'border-[hsl(var(--color-warning))]/30',
          glowColor: 'shadow-[hsl(var(--color-warning))]/20',
        };
      case 'info':
        return {
          icon: (
            <div className="relative">
              <Info className="h-8 w-8 text-[hsl(var(--color-info))] animate-pulse" />
              <Sparkles className="h-4 w-4 text-[hsl(var(--color-info))]/80 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-[hsl(var(--color-info))] hover:bg-[hsl(var(--color-info))]/90 text-white shadow-lg shadow-[hsl(var(--color-info))]/20',
          iconBg: 'bg-[hsl(var(--color-info))]/10 dark:bg-[hsl(var(--color-info))]/20',
          borderColor: 'border-[hsl(var(--color-info))]/30',
          glowColor: 'shadow-[hsl(var(--color-info))]/20',
        };
      case 'success':
        return {
          icon: (
            <div className="relative">
              <CheckCircle className="h-8 w-8 text-[hsl(var(--color-success))] animate-pulse" />
              <Heart className="h-4 w-4 text-[hsl(var(--color-success))]/80 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-[hsl(var(--color-success))] hover:bg-[hsl(var(--color-success))]/90 text-[hsl(var(--color-rich-black))] shadow-lg shadow-[hsl(var(--color-success))]/20',
          iconBg: 'bg-[hsl(var(--color-success))]/10 dark:bg-[hsl(var(--color-success))]/20',
          borderColor: 'border-[hsl(var(--color-success))]/30',
          glowColor: 'shadow-[hsl(var(--color-success))]/20',
        };
      default:
        return {
          icon: (
            <div className="relative">
              <AlertCircle className="h-8 w-8 text-muted-foreground animate-pulse" />
              <Sparkles className="h-4 w-4 text-muted-foreground/80 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20',
          iconBg: 'bg-muted',
          borderColor: 'border-border',
          glowColor: 'shadow-border/30',
        };
    }
  };

  const styles = getVariantStyles();
  const displayIcon = icon || styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md relative overflow-hidden max-h-[90vh] overflow-y-auto !fixed !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%] !z-[100]">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card/50 to-muted/30 opacity-50"></div>
        
        <DialogHeader className="text-center relative z-10">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${styles.iconBg} ${styles.borderColor} border-2 mb-6 shadow-lg ${styles.glowColor} transform transition-transform duration-300 hover:scale-110`}>
            {displayIcon}
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mb-2">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground mt-2 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 mt-8 relative z-10">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1 hover:bg-accent transition-all duration-200 hover:scale-105"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto order-1 sm:order-2 ${styles.confirmButton} transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </DialogContent>
    </Dialog>
  );
}

// Specialized dialog components for common use cases
export function ModernDeleteConfirmationDialog({
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
    <ModernConfirmationDialog
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

export function ModernStatusChangeConfirmationDialog({
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
    <ModernConfirmationDialog
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

export default ModernConfirmationDialog;
