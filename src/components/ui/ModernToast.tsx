import React from 'react';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2 
} from 'lucide-react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const getToastIcon = (variant: string) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'loading':
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

const getToastStyles = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'loading':
      return 'border-blue-200 bg-blue-50';
    case 'info':
    default:
      return 'border-blue-200 bg-blue-50';
  }
};

export const showModernToast = ({ 
  title, 
  description, 
  variant = 'info', 
  duration = 4000,
  action 
}: ToastProps) => {
  const toastId = toast.custom((t) => (
    <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md ${getToastStyles(variant)}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getToastIcon(variant)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {title}
        </p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={() => toast.dismiss(t)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ), {
    duration: variant === 'loading' ? Infinity : duration,
  });

  return toastId;
};

// Convenience functions
export const showSuccessToast = (title: string, description?: string, action?: ToastProps['action']) => {
  return showModernToast({ title, description, variant: 'success', action });
};

export const showErrorToast = (title: string, description?: string, action?: ToastProps['action']) => {
  return showModernToast({ title, description, variant: 'error', action });
};

export const showWarningToast = (title: string, description?: string, action?: ToastProps['action']) => {
  return showModernToast({ title, description, variant: 'warning', action });
};

export const showInfoToast = (title: string, description?: string, action?: ToastProps['action']) => {
  return showModernToast({ title, description, variant: 'info', action });
};

export const showLoadingToast = (title: string, description?: string) => {
  return showModernToast({ title, description, variant: 'loading' });
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};














