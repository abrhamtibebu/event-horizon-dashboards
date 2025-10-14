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
  Info, 
  CheckCircle, 
  AlertCircle, 
  X,
  Loader2 
} from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  showCloseButton?: boolean;
  closeText?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  showCloseButton = true,
  closeText = 'Close',
  icon,
  children,
}: AlertDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          iconBg: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          iconBg: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-900',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          iconBg: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-900',
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-6 w-6 text-blue-600" />,
          iconBg: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
        };
    }
  };

  const styles = getVariantStyles();
  const displayIcon = icon || styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} ${styles.borderColor} border-2 mb-4`}>
            {displayIcon}
          </div>
          <DialogTitle className={`text-xl font-semibold ${styles.titleColor}`}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
        
        {showCloseButton && (
          <DialogFooter className="mt-6">
            <Button
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              {closeText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Specialized alert components
export function SuccessAlert({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant="success"
      children={children}
    />
  );
}

export function WarningAlert({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant="warning"
      children={children}
    />
  );
}

export function ErrorAlert({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant="error"
      children={children}
    />
  );
}

export function InfoAlert({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant="info"
      children={children}
    />
  );
}














