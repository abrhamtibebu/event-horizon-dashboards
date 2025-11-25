import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  FileCheck, 
  PlayCircle, 
  CheckSquare 
} from 'lucide-react';

interface VendorLifecycleStageBadgeProps {
  stage: 'discovery' | 'engagement' | 'evaluation' | 'contracting' | 'execution' | 'closure';
  size?: 'sm' | 'md' | 'lg';
}

const stageConfig = {
  discovery: {
    label: 'Discovery',
    icon: Search,
    variant: 'secondary' as const,
    color: 'bg-gray-100 text-gray-800'
  },
  engagement: {
    label: 'Engagement',
    icon: FileText,
    variant: 'default' as const,
    color: 'bg-blue-100 text-blue-800'
  },
  evaluation: {
    label: 'Evaluation',
    icon: CheckCircle,
    variant: 'default' as const,
    color: 'bg-yellow-100 text-yellow-800'
  },
  contracting: {
    label: 'Contracting',
    icon: FileCheck,
    variant: 'default' as const,
    color: 'bg-purple-100 text-purple-800'
  },
  execution: {
    label: 'Execution',
    icon: PlayCircle,
    variant: 'default' as const,
    color: 'bg-green-100 text-green-800'
  },
  closure: {
    label: 'Closure',
    icon: CheckSquare,
    variant: 'default' as const,
    color: 'bg-indigo-100 text-indigo-800'
  }
};

export default function VendorLifecycleStageBadge({ stage, size = 'md' }: VendorLifecycleStageBadgeProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge variant={config.variant} className={`${config.color} ${sizeClasses[size]} flex items-center gap-1.5`}>
      <Icon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      {config.label}
    </Badge>
  );
}


