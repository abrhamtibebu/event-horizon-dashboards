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
              <Trash2 className="h-8 w-8 text-red-600 animate-pulse" />
              <Zap className="h-4 w-4 text-red-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-200/50',
          iconBg: 'bg-gradient-to-br from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          glowColor: 'shadow-red-200/30',
        };
      case 'warning':
        return {
          icon: (
            <div className="relative">
              <AlertTriangle className="h-8 w-8 text-yellow-600 animate-pulse" />
              <Shield className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg shadow-yellow-200/50',
          iconBg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
          borderColor: 'border-yellow-200',
          glowColor: 'shadow-yellow-200/30',
        };
      case 'info':
        return {
          icon: (
            <div className="relative">
              <Info className="h-8 w-8 text-blue-600 animate-pulse" />
              <Sparkles className="h-4 w-4 text-blue-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-200/50',
          iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          glowColor: 'shadow-blue-200/30',
        };
      case 'success':
        return {
          icon: (
            <div className="relative">
              <CheckCircle className="h-8 w-8 text-green-600 animate-pulse" />
              <Heart className="h-4 w-4 text-green-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-200/50',
          iconBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          glowColor: 'shadow-green-200/30',
        };
      default:
        return {
          icon: (
            <div className="relative">
              <AlertCircle className="h-8 w-8 text-gray-600 animate-pulse" />
              <Sparkles className="h-4 w-4 text-gray-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          ),
          confirmButton: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg shadow-gray-200/50',
          iconBg: 'bg-gradient-to-br from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          glowColor: 'shadow-gray-200/30',
        };
    }
  };

  const styles = getVariantStyles();
  const displayIcon = icon || styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 opacity-50"></div>
        
        <DialogHeader className="text-center relative z-10">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${styles.iconBg} ${styles.borderColor} border-2 mb-6 shadow-lg ${styles.glowColor} transform transition-transform duration-300 hover:scale-110`}>
            {displayIcon}
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 mt-2 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 mt-8 relative z-10">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
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

export { ModernConfirmationDialog };
export default ModernConfirmationDialog;
