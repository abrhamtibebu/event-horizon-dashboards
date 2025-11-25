import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Phone } from 'lucide-react'

export default function SubscriptionPayment() {
  const { subscription, refetch } = useSubscription()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe_birr'>('telebirr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)

  useEffect(() => {
    if (!subscription) {
      navigate('/dashboard/subscription/plans')
    }
  }, [subscription, navigate])

  const handleInitiatePayment = async () => {
    if (!subscription) return

    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      const data = await subscriptionsApi.initiatePayment({
        subscription_id: subscription.id,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
      })

      setPaymentData(data)
      setPaymentInitiated(true)

      toast({
        title: 'Payment Request Sent',
        description: data.message,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initiate payment',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentData) return

    setIsProcessing(true)
    try {
      const result = await subscriptionsApi.confirmPayment(paymentData.payment_id)

      if (result.success) {
        toast({
          title: 'Payment Confirmed',
          description: 'Your subscription has been activated successfully.',
        })
        await refetch()
        navigate('/dashboard/subscription')
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message || 'Payment confirmation failed',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to confirm payment',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
        <p className="text-muted-foreground">Complete your subscription payment to activate your plan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            {subscription.plan?.name} Plan -{' '}
            {subscription.billing_cycle === 'yearly'
              ? subscription.plan?.price_yearly.toLocaleString()
              : subscription.plan?.price_monthly.toLocaleString()}{' '}
            ETB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!paymentInitiated ? (
            <>
              <div>
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'telebirr' | 'cbe_birr')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="telebirr" id="telebirr" />
                    <Label htmlFor="telebirr" className="font-normal cursor-pointer">
                      Telebirr
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cbe_birr" id="cbe_birr" />
                    <Label htmlFor="cbe_birr" className="font-normal cursor-pointer">
                      CBE Birr
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your {paymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} phone number
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleInitiatePayment}
                disabled={isProcessing || !phoneNumber}
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Initiate Payment
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Payment Request Sent</h3>
                </div>
                <p className="text-sm text-green-800">
                  {paymentData?.message || 'Please check your phone for payment notification'}
                </p>
                {paymentData && (
                  <div className="mt-3 text-sm text-green-700">
                    <p>Payment Reference: {paymentData.payment_reference}</p>
                    <p>Amount: {paymentData.amount.toLocaleString()} {paymentData.currency}</p>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Confirming...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

