import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  X,
  Loader2,
  CreditCard,
  FileText,
  Hash
} from 'lucide-react';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'success';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'email' | 'password';
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    description?: string;
  }[];
}

export function InputDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
  icon,
  fields,
}: InputDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      const initialData: Record<string, string> = {};
      fields.forEach(field => {
        initialData[field.name] = field.defaultValue || '';
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, fields]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          iconBg: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          iconBg: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-6 w-6 text-blue-600" />,
          iconBg: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
    }
  };

  const styles = getVariantStyles();
  const displayIcon = icon || styles.icon;

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose();
  };

  const getFieldIcon = (fieldName: string) => {
    if (fieldName.toLowerCase().includes('transaction')) {
      return <Hash className="h-4 w-4 text-gray-500" />;
    }
    if (fieldName.toLowerCase().includes('note')) {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
    if (fieldName.toLowerCase().includes('payment')) {
      return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} ${styles.borderColor} border-2 mb-4`}>
            {displayIcon}
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              <div className="relative">
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`pr-10 ${errors[field.name] ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`pr-10 ${errors[field.name] ? 'border-red-500' : ''}`}
                  />
                )}
                
                {getFieldIcon(field.name) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon(field.name)}
                  </div>
                )}
              </div>
              
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
              
              {errors[field.name] && (
                <p className="text-xs text-red-500">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialized input dialog components for common use cases
export function TransactionInputDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { transactionId: string; notes: string }) => void;
  isLoading?: boolean;
}) {
  return (
    <InputDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={(data) => onConfirm({
        transactionId: data.transactionId || '',
        notes: data.notes || ''
      })}
      title="Process Payment"
      description="Enter the transaction details to process this payment."
      confirmText="Process Payment"
      cancelText="Cancel"
      variant="info"
      isLoading={isLoading}
      icon={<CreditCard className="h-6 w-6 text-blue-600" />}
      fields={[
        {
          name: 'transactionId',
          label: 'Transaction ID',
          type: 'text',
          placeholder: 'Enter transaction ID (optional)',
          required: false,
          description: 'The transaction reference number from your payment system'
        },
        {
          name: 'notes',
          label: 'Additional Notes',
          type: 'textarea',
          placeholder: 'Enter additional notes (optional)',
          required: false,
          description: 'Any additional information about this payment'
        }
      ]}
    />
  );
}

export function PaymentNotesDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading?: boolean;
}) {
  return (
    <InputDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={(data) => onConfirm(data.notes || '')}
      title="Add Payment Notes"
      description="Add additional notes or comments for this payment."
      confirmText="Add Notes"
      cancelText="Cancel"
      variant="info"
      isLoading={isLoading}
      icon={<FileText className="h-6 w-6 text-blue-600" />}
      fields={[
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Enter additional notes (optional)',
          required: false,
          description: 'Any additional information about this payment'
        }
      ]}
    />
  );
}

export function TransactionIdDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string) => void;
  isLoading?: boolean;
}) {
  return (
    <InputDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={(data) => onConfirm(data.transactionId || '')}
      title="Enter Transaction ID"
      description="Please provide the transaction ID for this payment."
      confirmText="Confirm"
      cancelText="Cancel"
      variant="info"
      isLoading={isLoading}
      icon={<Hash className="h-6 w-6 text-blue-600" />}
      fields={[
        {
          name: 'transactionId',
          label: 'Transaction ID',
          type: 'text',
          placeholder: 'Enter transaction ID (optional)',
          required: false,
          description: 'The transaction reference number from your payment system'
        }
      ]}
    />
  );
}














