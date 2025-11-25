import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import vendorApi from '@/lib/vendorApi';
import vendorContractApi from '@/lib/vendorContractApi';

interface VendorReliabilityScoreProps {
  contractId: number;
}

export default function VendorReliabilityScore({ contractId }: VendorReliabilityScoreProps) {
  const { data: contract } = useQuery({
    queryKey: ['vendor-contract', contractId],
    queryFn: () => vendorContractApi.getContract(contractId),
  });

  const contractData = contract?.success ? contract.data : null;
  const vendorId = contractData?.vendor_id;

  const { data: reliabilityScore, isLoading } = useQuery({
    queryKey: ['vendor-reliability-score', vendorId],
    queryFn: () => vendorApi.getVendorReliabilityScore(vendorId!),
    enabled: !!vendorId,
  });

  const scores = reliabilityScore || {};

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Reliability Score</CardTitle>
        <CardDescription>
          Historical performance metrics for {contractData?.vendor?.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-6 bg-muted rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            <span className="text-4xl font-bold">{scores.overall?.toFixed(1) || 'N/A'}</span>
            <span className="text-2xl text-muted-foreground">/ 5.0</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {scores.total_reviews || 0} review(s)
          </p>
        </div>

        <div className="space-y-3">
          {[
            { key: 'timeliness', label: 'Timeliness' },
            { key: 'quality_of_work', label: 'Quality of Work' },
            { key: 'professionalism', label: 'Professionalism' },
            { key: 'communication', label: 'Communication' },
            { key: 'value_for_money', label: 'Value for Money' },
          ].map(({ key, label }) => {
            const score = scores[key as keyof typeof scores] as number || 0;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium">{score.toFixed(1)}/5</span>
                </div>
                <Progress value={(score / 5) * 100} className="h-2" />
              </div>
            );
          })}
        </div>

        {scores.recommendation_rate !== undefined && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recommendation Rate</span>
              <Badge variant="default">
                {scores.recommendation_rate.toFixed(0)}%
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


