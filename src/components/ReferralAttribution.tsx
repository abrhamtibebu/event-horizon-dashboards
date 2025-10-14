import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, ExternalLink, Users } from 'lucide-react';
import { useReferralTracking } from '@/lib/referralTracking';

interface ReferralAttributionProps {
  className?: string;
  showDetails?: boolean;
}

export function ReferralAttribution({ className, showDetails = false }: ReferralAttributionProps) {
  const { attributionInfo } = useReferralTracking();

  if (!attributionInfo.hasReferral) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                Referred by vendor
              </span>
              <Badge variant="secondary" className="text-xs">
                {attributionInfo.referralCode}
              </Badge>
            </div>
            {showDetails && (
              <div className="mt-1 text-xs text-gray-500">
                {attributionInfo.utmSource && (
                  <span>Source: {attributionInfo.utmSource}</span>
                )}
                {attributionInfo.utmCampaign && (
                  <span className="ml-2">Campaign: {attributionInfo.utmCampaign}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for showing referral success message
export function ReferralSuccessMessage({ className }: { className?: string }) {
  const { attributionInfo } = useReferralTracking();

  if (!attributionInfo.hasReferral) {
    return null;
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">
            Thank you for using our referral link!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            You were referred by vendor code: <span className="font-mono font-semibold">{attributionInfo.referralCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Component for showing referral tracking info in admin/analytics
export function ReferralTrackingInfo({ className }: { className?: string }) {
  const { attributionInfo } = useReferralTracking();

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Share2 className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Referral Tracking Active
          </h3>
          <div className="text-sm text-blue-700 mt-1 space-y-1">
            {attributionInfo.hasReferral ? (
              <>
                <p>Referral Code: <span className="font-mono font-semibold">{attributionInfo.referralCode}</span></p>
                {attributionInfo.utmSource && (
                  <p>UTM Source: <span className="font-semibold">{attributionInfo.utmSource}</span></p>
                )}
                {attributionInfo.utmCampaign && (
                  <p>UTM Campaign: <span className="font-semibold">{attributionInfo.utmCampaign}</span></p>
                )}
              </>
            ) : (
              <p>No referral tracking detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


