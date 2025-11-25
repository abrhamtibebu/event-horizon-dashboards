import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface LoadingDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  status?: 'loading' | 'success' | 'error';
  progress?: number;
  showProgress?: boolean;
}

export function LoadingDialog({
  isOpen,
  title = 'Processing...',
  description = 'Please wait while we process your request.',
  status = 'loading',
  progress,
  showProgress = false,
}: LoadingDialogProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      case 'loading':
      default:
        return <Spinner size="lg" variant="primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
      default:
        return 'text-blue-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4">
            {getStatusIcon()}
          </div>
          
          <h3 className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
            {title}
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            {description}
          </p>
          
          {showProgress && progress !== undefined && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status === 'success' ? 'bg-green-600' :
                    status === 'error' ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}














