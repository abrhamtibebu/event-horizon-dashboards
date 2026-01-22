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
        return <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />;
      case 'loading':
      default:
        return <Spinner size="lg" variant="primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'loading':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground text-center mb-6">
            {description}
          </p>
          
          {showProgress && progress !== undefined && (
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
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














