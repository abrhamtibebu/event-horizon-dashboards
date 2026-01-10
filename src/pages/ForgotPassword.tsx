import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Mail, Info } from 'lucide-react'

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold text-card-foreground">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Password reset assistance
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-info/10 border border-info/20 rounded-lg">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Please contact your administrator for password reset assistance.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a 
                    href="mailto:info@validity.et" 
                    className="text-info hover:text-info/80 hover:underline font-medium"
                  >
                    info@validity.et
                  </a>
                </div>
              </div>
            </div>

            <Button variant="ghost" asChild className="w-full">
              <Link
                to="/sign-in"
                className="flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
