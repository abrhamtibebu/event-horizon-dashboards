import { useState, useCallback } from 'react';
import { showModernToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast, dismissToast } from '@/components/ui/ModernToast';

export interface ConfirmationOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
}

export interface AlertOptions {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useModernAlerts = () => {
  // Toast functions
  const showToast = useCallback((options: AlertOptions) => {
    return showModernToast(options);
  }, []);

  const showSuccess = useCallback((title: string, description?: string, action?: AlertOptions['action']) => {
    return showSuccessToast(title, description, action);
  }, []);

  const showError = useCallback((title: string, description?: string, action?: AlertOptions['action']) => {
    return showErrorToast(title, description, action);
  }, []);

  const showWarning = useCallback((title: string, description?: string, action?: AlertOptions['action']) => {
    return showWarningToast(title, description, action);
  }, []);

  const showInfo = useCallback((title: string, description?: string, action?: AlertOptions['action']) => {
    return showInfoToast(title, description, action);
  }, []);

  const showLoading = useCallback((title: string, description?: string) => {
    return showLoadingToast(title, description);
  }, []);

  const dismiss = useCallback((toastId: string | number) => {
    dismissToast(toastId);
  }, []);

  // Simple confirmation function (without dialog for now)
  const confirmDelete = useCallback((
    itemName: string,
    itemType: string = 'item',
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`);
      if (confirmed) {
        onConfirm().then(() => resolve(true)).catch(() => resolve(false));
      } else {
        if (onCancel) onCancel();
        resolve(false);
      }
    });
  }, []);

  const confirmAction = useCallback((
    title: string,
    description: string,
    confirmText: string = 'Confirm',
    variant: 'danger' | 'warning' | 'info' | 'success' = 'info',
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(`${title}\n\n${description}`);
      if (confirmed) {
        onConfirm().then(() => resolve(true)).catch(() => resolve(false));
      } else {
        if (onCancel) onCancel();
        resolve(false);
      }
    });
  }, []);

  // Async operation helpers
  const executeWithFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loadingTitle?: string;
      loadingDescription?: string;
      successTitle?: string;
      successDescription?: string;
      errorTitle?: string;
      errorDescription?: string;
    } = {}
  ): Promise<T | null> => {
    const {
      loadingTitle = 'Processing...',
      loadingDescription = 'Please wait while we process your request.',
      successTitle = 'Success!',
      successDescription = 'Operation completed successfully.',
      errorTitle = 'Error',
      errorDescription = 'An error occurred while processing your request.',
    } = options;

    const loadingToastId = showLoading(loadingTitle, loadingDescription);

    try {
      const result = await operation();
      dismiss(loadingToastId);
      showSuccess(successTitle, successDescription);
      return result;
    } catch (error) {
      dismiss(loadingToastId);
      const errorMessage = error instanceof Error ? error.message : errorDescription;
      showError(errorTitle, errorMessage);
      return null;
    }
  }, [showLoading, dismiss, showSuccess, showError]);

  return {
    // Toast functions
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    
    // Confirmation functions
    confirmDelete,
    confirmAction,
    
    // Async operation helpers
    executeWithFeedback,
  };
};

export default useModernAlerts;