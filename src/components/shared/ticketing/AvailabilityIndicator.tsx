import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AvailabilityIndicatorProps {
  remaining: number;
  total: number;
  availabilityStatus: 'available' | 'limited' | 'selling_fast' | 'sold_out';
  showProgressBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AvailabilityIndicator: React.FC<AvailabilityIndicatorProps> = ({
  remaining,
  total,
  availabilityStatus,
  showProgressBar = true,
  size = 'md',
}) => {
  const percentRemaining = total > 0 ? (remaining / total) * 100 : 0;

  // Color coding based on availability
  const getColor = () => {
    if (availabilityStatus === 'sold_out') return 'text-red-600 bg-red-50';
    if (percentRemaining < 20) return 'text-red-600 bg-red-50';
    if (percentRemaining < 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressColor = () => {
    if (availabilityStatus === 'sold_out') return 'bg-red-500';
    if (percentRemaining < 20) return 'bg-red-500';
    if (percentRemaining < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBadgeText = () => {
    switch (availabilityStatus) {
      case 'sold_out':
        return 'Sold Out';
      case 'limited':
        return 'Limited Availability';
      case 'selling_fast':
        return 'Selling Fast';
      default:
        return 'Available';
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="space-y-2">
      {/* Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`${getColor()} ${sizeClasses[size]} font-medium`}
        >
          {availabilityStatus === 'selling_fast' && (
            <TrendingUp className="w-3 h-3 mr-1" />
          )}
          {(availabilityStatus === 'limited' || availabilityStatus === 'sold_out') && (
            <AlertCircle className="w-3 h-3 mr-1" />
          )}
          {getBadgeText()}
        </Badge>

        {availabilityStatus !== 'sold_out' && (
          <span className={`${sizeClasses[size]} text-gray-600`}>
            {remaining} of {total} remaining
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {showProgressBar && availabilityStatus !== 'sold_out' && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`${getProgressColor()} h-full rounded-full transition-all duration-300 ${
              availabilityStatus === 'limited' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default AvailabilityIndicator;







