import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '@/lib/vendorApi';
import vendorContractApi from '@/lib/vendorContractApi';

interface VendorReviewFormProps {
  contractId: number;
  onClose: () => void;
}

export default function VendorReviewForm({ contractId, onClose }: VendorReviewFormProps) {
  const [ratings, setRatings] = useState({
    timeliness: 3,
    quality_of_work: 3,
    professionalism: 3,
    communication: 3,
    value_for_money: 3,
  });
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const queryClient = useQueryClient();

  const { data: contract } = useQuery({
    queryKey: ['vendor-contract', contractId],
    queryFn: () => vendorContractApi.getContract(contractId),
  });

  const contractData = contract?.success ? contract.data : null;

  const reviewMutation = useMutation({
    mutationFn: (data: any) => vendorApi.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts'] });
      toast.success('Review submitted successfully!');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit review';
      const errorDetails = error?.response?.data?.errors;
      
      if (errorDetails) {
        const errorText = Object.values(errorDetails).flat().join(', ');
        toast.error(`${errorMessage}: ${errorText}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractData) return;

    reviewMutation.mutate({
      vendor_id: contractData.vendor_id,
      contract_id: contractId,
      event_id: contractData.event_id,
      ...ratings,
      comments,
      strengths,
      improvements,
      would_recommend: wouldRecommend,
    });
  };

  const updateRating = (field: string, value: number[]) => {
    setRatings(prev => ({ ...prev, [field]: value[0] }));
  };

  const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance Review</CardTitle>
        <CardDescription>
          Rate vendor performance for contract {contractData?.contract_number}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries({
            timeliness: 'Timeliness',
            quality_of_work: 'Quality of Work',
            professionalism: 'Professionalism',
            communication: 'Communication',
            value_for_money: 'Value for Money',
          }).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{ratings[key as keyof typeof ratings]}/5</span>
                </div>
              </div>
              <Slider
                value={[ratings[key as keyof typeof ratings]]}
                onValueChange={(value) => updateRating(key, value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          ))}

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Overall Score</Label>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Overall comments about the vendor..."
            />
          </div>

          <div className="space-y-2">
            <Label>Strengths</Label>
            <Textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What did the vendor do well?"
            />
          </div>

          <div className="space-y-2">
            <Label>Areas for Improvement</Label>
            <Textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="What could be improved?"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="recommend" className="cursor-pointer">
              Would recommend this vendor for future events
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


