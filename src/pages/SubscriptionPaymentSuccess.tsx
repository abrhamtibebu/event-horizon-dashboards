import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSubscription } from '@/hooks/useSubscription'

export default function SubscriptionPaymentSuccess() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { refetch } = useSubscription()

    useEffect(() => {
        toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed. We are activating your subscription.',
        })

        // Refetch subscription status to show the updated plan
        refetch()

        // Auto redirect after 5 seconds
        const timer = setTimeout(() => {
            navigate('/dashboard/subscription')
        }, 5000)

        return () => clearTimeout(timer)
    }, [navigate, toast, refetch])

    return (
        <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[60vh]">
            <Card className="max-w-md w-full border-2 shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-black text-green-700">Payment Success!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <p className="text-muted-foreground">
                        Thank you for your payment. Your subscription is being activated and your account limits will be updated shortly.
                    </p>

                    <div className="p-4 bg-muted/50 rounded-xl text-sm">
                        <p className="font-medium">You will be automatically redirected in a few seconds...</p>
                    </div>

                    <Button
                        className="w-full h-12 font-bold"
                        onClick={() => navigate('/dashboard/subscription')}
                    >
                        Go to Subscriptions
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
