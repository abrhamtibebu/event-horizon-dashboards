import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Download,
  Mail,
  Calendar,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Home,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomRegistrationSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { registrationData, eventData } = location.state || {};

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No registration data found. Please complete the registration process.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ colorScheme: 'light' }}>
      {/* Success Banner */}
      <section className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-white/30 via-transparent to-white/20"></div>
        </div>

        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/50">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Registration Successful!
            </h1>

            <p className="text-xl text-white/90 mb-6 drop-shadow">
              Welcome to {eventData?.name || 'the event'}
            </p>

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white border border-white/30">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">You're all set!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative -mt-16 z-10 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              {/* Success Message */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Congratulations!</h2>
                <p className="text-xl text-gray-600 mb-6">
                  Your registration for {eventData?.name || 'the event'} has been successfully completed.
                </p>
                <div className="inline-flex items-center gap-3 bg-accent border border-border rounded-2xl px-6 py-4">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Registration Code</p>
                    <p className="text-lg font-bold text-foreground font-mono">{registrationData.registration_code}</p>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              {eventData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  {/* Event Info */}
                  <div className="bg-muted/30 rounded-2xl p-8 border border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Event Information</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <p className="font-semibold text-foreground">Date & Time</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(eventData.start_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(eventData.start_date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-foreground">Location</p>
                          <p className="text-sm text-muted-foreground">{eventData.venue_name || eventData.location}</p>
                          {eventData.formatted_address && (
                            <p className="text-sm text-muted-foreground">{eventData.formatted_address}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Users className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-foreground">Event Type</p>
                          <p className="text-sm text-muted-foreground capitalize">{eventData.event_type}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-accent rounded-2xl p-8 border border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">What's Next?</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-card backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm border border-border">
                          <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-1">Confirmation Email</h4>
                          <p className="text-sm text-muted-foreground">
                            Your confirmation email with e-badge PDF has been sent to your email address. Please check your inbox (and spam folder) for the attachment.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-card backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm border border-border">
                          <FileText className="w-6 h-6 text-success" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-1">Document Processing</h4>
                          <p className="text-sm text-muted-foreground">
                            Your passport documents will be reviewed. If you requested visa support, our team will contact you within 48 hours.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-card backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm border border-border">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-1">Event Check-in</h4>
                          <p className="text-sm text-muted-foreground">
                            Bring your registration code and valid ID for check-in on the event day.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-border">
                <Button
                  onClick={() => navigate('/')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="border-border hover:border-primary hover:bg-accent font-semibold py-3 px-8 rounded-xl flex items-center gap-2 transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  Print Confirmation
                </Button>
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Need help? Contact our support team at support@validity.et</p>
                <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                  <span className="text-xs text-muted-foreground">Registration Code:</span>
                  <span className="text-sm font-bold text-primary font-mono">{registrationData.registration_code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomRegistrationSuccess;
