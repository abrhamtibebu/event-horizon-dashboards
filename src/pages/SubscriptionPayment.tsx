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
import { CreditCard, Phone, Zap, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function SubscriptionPayment() {
  const { subscription, refetch } = useSubscription()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe_birr' | 'chapa'>('chapa')
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

    if (paymentMethod !== 'chapa' && !phoneNumber) {
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
        phone_number: phoneNumber || '0900000000', // Dummy for Chapa if not required
      })

      setPaymentData(data)
      setPaymentInitiated(true)

      // If there's a checkout URL, redirect the user
      if (data.checkout_url) {
        toast({
          title: 'Redirecting to Payment',
          description: 'You are being redirected to the secure payment page.',
        })

        // Wait a bit so they can see the toast
        setTimeout(() => {
          window.location.href = data.checkout_url
        }, 1500)
        return
      }

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
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Complete Payment
        </h1>
        <p className="text-muted-foreground">Choose your preferred payment method to activate your {subscription.plan?.name} plan</p>
      </div>

      <Card className="border-2 shadow-lg overflow-hidden">
        <div className="bg-primary/5 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plan Summary</span>
            <Badge variant="outline" className="bg-background">
              {subscription.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black">
              {subscription.billing_cycle === 'yearly'
                ? subscription.plan?.price_yearly.toLocaleString()
                : subscription.plan?.price_monthly.toLocaleString()}{' '}
            </span>
            <span className="text-sm font-bold text-muted-foreground">ETB</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Access to all {subscription.plan?.name} features
          </p>
        </div>

        <CardContent className="p-6 space-y-8">
          {!paymentInitiated ? (
            <>
              <div className="space-y-4">
                <Label className="text-base font-bold">Select Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as 'telebirr' | 'cbe_birr' | 'chapa')}
                  className="grid grid-cols-1 gap-4"
                >
                  <Label
                    htmlFor="chapa"
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted/50",
                      paymentMethod === 'chapa' ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="chapa" id="chapa" className="sr-only" />
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold">Chapa</p>
                        <p className="text-xs text-muted-foreground">Credit Card, Telebirr, CBE Birr & More</p>
                      </div>
                    </div>
                    {paymentMethod === 'chapa' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </Label>

                  <Label
                    htmlFor="telebirr"
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted/50",
                      paymentMethod === 'telebirr' ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="telebirr" id="telebirr" className="sr-only" />
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold">Telebirr</p>
                        <p className="text-xs text-muted-foreground">Direct Telebirr Payment</p>
                      </div>
                    </div>
                    {paymentMethod === 'telebirr' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </Label>

                  <Label
                    htmlFor="cbe_birr"
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-muted/50",
                      paymentMethod === 'cbe_birr' ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="cbe_birr" id="cbe_birr" className="sr-only" />
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-bold">CBE Birr</p>
                        <p className="text-xs text-muted-foreground">Commercial Bank of Ethiopia</p>
                      </div>
                    </div>
                    {paymentMethod === 'cbe_birr' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </Label>
                </RadioGroup>
              </div>

              {paymentMethod !== 'chapa' && (
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-bold">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0912345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number associated with your {paymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} account.
                  </p>
                </div>
              )}

              <Button
                className="w-full h-12 text-lg font-bold shadow-lg"
                onClick={handleInitiatePayment}
                disabled={isProcessing || (paymentMethod !== 'chapa' && !phoneNumber)}
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Processing Securely...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    {paymentMethod === 'chapa' ? 'Pay with Chapa' : 'Initiate Payment'}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secure SSL Encrypted Payment Gateway
              </p>
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">Awaiting Confirmation</h3>
                    <p className="text-sm text-muted-foreground">Please complete the payment on your device</p>
                  </div>
                </div>

                <Separator className="my-4 bg-primary/10" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono font-bold">{paymentData.payment_reference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-black">{paymentData.amount.toLocaleString()} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="capitalize font-bold">{paymentData.payment_method.replace('_', ' ')}</span>
                  </div>
                </div>

                {paymentData.checkout_url && (
                  <div className="mt-6">
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5" asChild>
                      <a href={paymentData.checkout_url}>Retry Payment Link</a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full h-12 font-bold shadow-md"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'I have completed the payment'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setPaymentInitiated(false)}
                >
                  Change payment method
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

