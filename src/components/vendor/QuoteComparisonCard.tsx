import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QuoteComparisonCardProps {
  quotation: {
    id: number;
    vendor_name: string;
    vendor_rating: number;
    total_cost: number;
    days_required?: number;
    scope_coverage?: number;
    confidence_score?: number;
    submission_date: string;
    status: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function QuoteComparisonCard({ quotation, isSelected, onSelect }: QuoteComparisonCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{quotation.vendor_name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{quotation.vendor_rating ? Number(quotation.vendor_rating).toFixed(1) : 'N/A'}</span>
            </div>
          </div>
          {isSelected && (
            <Badge variant="default">Selected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{Number(quotation.total_cost).toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">ETB</span>
          </div>
        </div>

        {quotation.confidence_score !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Confidence Score</span>
              <span className="text-xs font-medium">{Number(quotation.confidence_score).toFixed(1)}%</span>
            </div>
            <Progress value={Number(quotation.confidence_score)} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {quotation.days_required !== undefined && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{quotation.days_required} days</span>
            </div>
          )}
          {quotation.scope_coverage !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{quotation.scope_coverage}% coverage</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Submitted: {new Date(quotation.submission_date).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


