import React, { useState, useEffect } from 'react';
import { paymentApi } from '@/lib/paymentApi';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Gift, Users, DollarSign } from 'lucide-react';

interface ReferralTrackerProps {
  referralToken?: string;
  eventId?: number;
  onReferralTracked?: (data: any) => void;
}

export const ReferralTracker: React.FC<ReferralTrackerProps> = ({
  referralToken,
  eventId,
  onReferralTracked,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    // Check if we have a referral token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = referralToken || urlParams.get('ref');
    const event = eventId || parseInt(urlParams.get('event_id') || '0');

    if (token && event) {
      // Validate the referral token
      validateReferralToken(token, event);
    }
  }, [referralToken, eventId]);

  const validateReferralToken = async (token: string, eventId: number) => {
    try {
      // This would typically be done on the backend
      // For now, we'll simulate the validation
      const isValid = token && token.length > 10;
      
      if (isValid) {
        setReferralData({
          token,
          eventId,
          vendor: 'Marketing Partner',
          commissionRate: 0.05,
        });
      }
    } catch (error) {
      console.error('Failed to validate referral token:', error);
    }
  };

  const handleRegistration = async () => {
    if (!referralData || !registrationData.name || !registrationData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsTracking(true);
    try {
      const result = await paymentApi.trackReferral(
        referralData.token,
        referralData.eventId,
        registrationData
      );

      toast.success('Registration successful! Thank you for using our referral link.');
      onReferralTracked?.(result);
      
      // Reset form
      setRegistrationData({
        name: '',
        email: '',
        phone: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Failed to track referral:', error);
      toast.error(error?.message || 'Failed to process registration');
    } finally {
      setIsTracking(false);
    }
  };

  if (!referralData) {
    return null; // Don't show anything if no referral token
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="h-6 w-6 text-purple-600" />
          <CardTitle className="text-lg">Referral Registration</CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          You were referred by <strong>{referralData.vendor}</strong>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Referral Benefits</span>
          </div>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• Special pricing for this event</li>
            <li>• Priority support</li>
            <li>• Exclusive access to vendor services</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={registrationData.name}
              onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={registrationData.email}
              onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={registrationData.phone}
              onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={registrationData.notes}
              onChange={(e) => setRegistrationData({ ...registrationData, notes: e.target.value })}
              placeholder="Any special requirements or notes..."
              rows={3}
            />
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Commission Earned</span>
          </div>
          <p className="text-xs text-green-700">
            {referralData.vendor} will earn {(referralData.commissionRate * 100).toFixed(1)}% commission for your registration
          </p>
        </div>

        <Button
          onClick={handleRegistration}
          disabled={isTracking || !registrationData.name || !registrationData.email}
          className="w-full"
        >
          {isTracking ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Registration
            </>
          )}
        </Button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our terms and conditions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralTracker;














