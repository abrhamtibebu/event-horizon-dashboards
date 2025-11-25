import React from 'react';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Sparkles,
  Zap,
  Shield,
  Heart,
  MessageCircle,
  User
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'message';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  showProgress?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  // Message-specific props
  senderName?: string;
  senderAvatar?: string;
  conversationId?: string;
  messagePreview?: string;
}

const getToastIcon = (variant: string) => {
  switch (variant) {
    case 'success':
      return (
        <div className="relative">
          <CheckCircle className="h-5 w-5 text-success animate-pulse" />
          <Sparkles className="h-3 w-3 text-success absolute -top-1 -right-1 animate-bounce" />
        </div>
      );
    case 'error':
      return (
        <div className="relative">
          <XCircle className="h-5 w-5 text-error animate-pulse" />
          <Zap className="h-3 w-3 text-error absolute -top-1 -right-1 animate-bounce" />
        </div>
      );
    case 'warning':
      return (
        <div className="relative">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--color-warning))] animate-pulse" />
          <Shield className="h-3 w-3 text-[hsl(var(--color-warning))] absolute -top-1 -right-1 animate-bounce" />
        </div>
      );
      case 'loading':
        return (
          <div className="relative">
            <Spinner size="sm" variant="primary" />
            <Heart className="h-3 w-3 text-info absolute -top-1 -right-1 animate-pulse" />
          </div>
        );
    case 'message':
      return (
        <div className="relative">
          <MessageCircle className="h-5 w-5 text-info animate-pulse" />
          <Sparkles className="h-3 w-3 text-info absolute -top-1 -right-1 animate-bounce" />
        </div>
      );
    case 'info':
    default:
      return (
        <div className="relative">
          <Info className="h-5 w-5 text-info animate-pulse" />
          <Sparkles className="h-3 w-3 text-info absolute -top-1 -right-1 animate-bounce" />
        </div>
      );
  }
};

const getToastStyles = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'border-success/30 bg-success/5 shadow-success/30';
    case 'error':
      return 'border-error/30 bg-error/5 shadow-error/30';
    case 'warning':
      return 'border-[hsl(var(--color-warning))]/30 bg-[hsl(var(--color-warning))]/5 shadow-[hsl(var(--color-warning))]/30';
    case 'loading':
      return 'border-info/30 bg-info/5 shadow-info/30';
    case 'message':
      return 'border-info/30 bg-info/5 shadow-info/30';
    case 'info':
    default:
      return 'border-info/30 bg-info/5 shadow-info/30';
  }
};

export const showModernToast = ({ 
  title, 
  description, 
  variant = 'info', 
  duration = 4000,
  action,
  showProgress = false,
  position = 'top-right',
  senderName,
  senderAvatar,
  conversationId,
  messagePreview
}: ToastProps) => {
  const toastId = toast.custom((t) => (
    <div className={`group relative flex items-start gap-3 p-4 rounded-xl border shadow-xl max-w-md backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 ${getToastStyles(variant)}`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Progress bar for loading toasts */}
      {showProgress && variant === 'loading' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--color-warning))] rounded-t-xl animate-pulse"></div>
      )}
      
      {/* Icon with enhanced animations */}
      <div className="flex-shrink-0 mt-0.5 relative z-10">
        {variant === 'message' && senderAvatar ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={senderAvatar} alt={senderName} />
            <AvatarFallback className="bg-info/10 text-info text-xs">
              {senderName ? senderName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            {getToastIcon(variant)}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        {variant === 'message' ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-card-foreground">
                {senderName}
              </p>
              <span className="text-xs text-muted-foreground/70">•</span>
              <p className="text-xs text-muted-foreground/70">New message</p>
            </div>
            {messagePreview && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {messagePreview}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-card-foreground transition-colors duration-200">
              {title}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center text-sm font-medium text-primary mt-2 transition-colors duration-200 hover:underline"
          >
            <span className="mr-1">→</span>
            {action.label}
          </button>
        )}
      </div>
      
      {/* Close button with enhanced hover effects */}
      <button
        onClick={() => toast.dismiss(t)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-accent rounded-full p-1 hover:scale-110"
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  ), {
    duration: variant === 'loading' ? Infinity : duration,
    position: position as any,
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

export const showMessageToast = (
  senderName: string,
  messagePreview: string,
  senderAvatar?: string,
  conversationId?: string,
  action?: ToastProps['action']
) => {
  return showModernToast({
    title: `New message from ${senderName}`,
    variant: 'message',
    senderName,
    senderAvatar,
    conversationId,
    messagePreview,
    action,
    duration: 6000, // Longer duration for messages
  });
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};














