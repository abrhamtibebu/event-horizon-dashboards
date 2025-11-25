import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartEmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  className?: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  icon: Icon,
  message,
  description,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center h-[300px]', className)}>
      <div className="text-center">
        <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};




















