import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Variant of the spinner style
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /**
   * Whether to show the spinner in a full-screen centered layout
   */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const variantClasses = {
  default: 'from-[hsl(var(--primary))] to-[hsl(var(--color-warning))]',
  primary: 'from-[hsl(var(--primary))] to-[hsl(var(--color-warning))]',
  success: 'from-[hsl(var(--color-success))] to-[hsl(var(--primary))]',
  warning: 'from-[hsl(var(--color-warning))] to-[hsl(var(--primary))]',
  error: 'from-[hsl(var(--color-error))] to-[hsl(var(--primary))]',
};

/**
 * Modern, fancy spinner component with smooth animations and gradient effects
 */
export function Spinner({
  size = 'md',
  text,
  className,
  variant = 'default',
  fullScreen = false,
}: SpinnerProps) {
  const spinnerSize = sizeClasses[size];
  const spinnerVariant = variantClasses[variant];

  const colorMap = {
    default: 'hsl(var(--primary))',
    primary: 'hsl(var(--primary))',
    success: 'hsl(var(--color-success))',
    warning: 'hsl(var(--color-warning))',
    error: 'hsl(var(--color-error))',
  } as const;

  const spinnerColor = colorMap[variant];

  const spinner = (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Main spinner ring - using borders for better compatibility */}
      <div
        className={cn(
          'relative rounded-full border-4 border-transparent',
          spinnerSize,
          'animate-spin'
        )}
        style={{
          borderTopColor: spinnerColor,
          borderRightColor: spinnerColor,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        }}
      >
        {/* Inner gradient overlay for modern look */}
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r opacity-30',
            spinnerVariant
          )}
          style={{
            mask: 'radial-gradient(circle, transparent 40%, black 60%)',
            WebkitMask: 'radial-gradient(circle, transparent 40%, black 60%)',
          }}
        />
      </div>
      
      {/* Outer glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-r',
          spinnerVariant,
          'opacity-20 blur-sm animate-pulse -z-10'
        )}
        style={{ transform: 'scale(1.2)' }}
      />
      
      {/* Pulsing center dot */}
      <div
        className="absolute rounded-full animate-ping"
        style={{
          width: size === 'sm' ? '4px' : size === 'md' ? '6px' : size === 'lg' ? '8px' : '10px',
          height: size === 'sm' ? '4px' : size === 'md' ? '6px' : size === 'lg' ? '8px' : '10px',
          backgroundColor: spinnerColor,
          opacity: 0.6,
        }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
        {text && (
          <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }

  if (text) {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        {spinner}
        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      </div>
    );
  }

  return spinner;
}

/**
 * Simple inline spinner variant for buttons and small spaces
 */
export function SpinnerInline({ size = 'sm', className }: { size?: 'sm' | 'md'; className?: string }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'relative rounded-full',
          sizeClass,
          'animate-spin',
          'border-2 border-transparent border-t-blue-600 border-r-blue-600',
          'opacity-75'
        )}
      />
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'border-2 border-blue-200 border-t-transparent',
          'animate-spin',
          '[animation-direction:reverse]',
          '[animation-duration:1.5s]'
        )}
      />
    </div>
  );
}

