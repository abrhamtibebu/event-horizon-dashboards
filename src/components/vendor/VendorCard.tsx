import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Mail, Phone, MapPin } from 'lucide-react';
import VendorLifecycleStageBadge from './VendorLifecycleStageBadge';
import { getStatusByValue } from '@/lib/vendorStatusConstants';

interface VendorCardProps {
  vendor: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    services_provided: string[];
    lifecycle_stage?: string;
    average_rating: number;
    total_ratings: number;
    status: string;
  };
  onClick?: () => void;
}

export default function VendorCard({ vendor, onClick }: VendorCardProps) {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${onClick ? '' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{vendor.name}</h3>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {vendor.lifecycle_stage && (
                <VendorLifecycleStageBadge 
                  stage={vendor.lifecycle_stage as any} 
                  size="sm" 
                />
              )}
              {vendor.status && (
                <Badge
                  className={`${getStatusByValue(vendor.status)?.bgColor || 'bg-gray-100'} ${getStatusByValue(vendor.status)?.textColor || 'text-gray-800'} text-xs`}
                >
                  {getStatusByValue(vendor.status)?.label || vendor.status}
                </Badge>
              )}
            </div>
          </div>
          {vendor.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{vendor.average_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({vendor.total_ratings})</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{vendor.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{vendor.phone}</span>
        </div>
        {vendor.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{vendor.address}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-3">
          {vendor.services_provided.slice(0, 3).map((service, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {service}
            </Badge>
          ))}
          {vendor.services_provided.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{vendor.services_provided.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


