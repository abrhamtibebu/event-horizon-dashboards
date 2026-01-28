import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, ArrowLeft, Calendar, Clock, MapPin, Mail, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api, { resendRegistrationEmail, getBadgePreview } from '@/lib/api';
import Badge from '@/components/Badge';

export default function RegistrationSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const badgeRef = useRef<HTMLDivElement>(null);
  const badgeCardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [badgeData, setBadgeData] = useState<any>(null);
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [emailSent, setEmailSent] = useState(true); // Assume email was sent on registration

  // Get registration data from URL params
  const attendeeId = searchParams.get('attendeeId');
  const eventId = searchParams.get('eventId');
  const eventName = searchParams.get('eventName');
  const eventDate = searchParams.get('eventDate');
  const eventTime = searchParams.get('eventTime');
  const eventLocation = searchParams.get('eventLocation');
  const guestName = searchParams.get('guestName');
  const guestEmail = searchParams.get('guestEmail');
  const guestPhone = searchParams.get('guestPhone');
  const guestCompany = searchParams.get('guestCompany');
  const guestJobTitle = searchParams.get('guestJobTitle');
  const guestGender = searchParams.get('guestGender');
  const guestCountry = searchParams.get('guestCountry');
  const guestUuid = searchParams.get('guestUuid');
  const guestTypeName = searchParams.get('guestTypeName');
  const guestTypePrice = searchParams.get('guestTypePrice');

  useEffect(() => {
    // Redirect if no data
    if (!attendeeId || !eventId || !eventName) {
      toast.error('Invalid registration data');
      // Don't redirect automatically, let user see the success message
    }
  }, [attendeeId, eventId, eventName]);

  // Load badge preview data when confirmation is shown
  useEffect(() => {
    if (showConfirmation && attendeeId && eventId && !badgeData && !loadingBadge) {
      loadBadgePreview();
    }
  }, [showConfirmation, attendeeId, eventId]);

  const loadBadgePreview = async () => {
    if (!attendeeId || !eventId) return;
    
    setLoadingBadge(true);
    try {
      const response = await getBadgePreview(Number(eventId), Number(attendeeId));
      setBadgeData(response.data);
    } catch (error: any) {
      console.error('Failed to load badge preview:', error);
      // Don't show error toast, just use fallback badge
    } finally {
      setLoadingBadge(false);
    }
  };

  const handleResendEmail = async () => {
    if (!attendeeId || !eventId) {
      toast.error('Invalid registration data');
      return;
    }

    setResendingEmail(true);
    try {
      await resendRegistrationEmail(Number(eventId), Number(attendeeId));
      toast.success('Confirmation email with e-badge has been sent! Please check your inbox.');
      setEmailSent(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to resend email. Please try again later.';
      toast.error(errorMessage);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDownloadBadge = async () => {
    if (!attendeeId || !eventId) {
      toast.error('Invalid registration data. Please try again.');
      return;
    }

    setDownloading(true);
    try {
      // Get pre-generated badge from API
      const response = await api.get(
        `/events/${eventId}/attendees/${attendeeId}/badge`,
        { responseType: 'blob' }
      );
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${guestName?.replace(/\s+/g, '-') || 'event'}-confirmation-badge.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('E-badge downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading badge:', error);
      toast.error(error.response?.data?.error || 'Failed to download badge. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'TBD';
    // If timeStr contains full datetime, parse it
    if (timeStr.includes('T') || timeStr.includes(' ')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    return timeStr;
  };

  if (!showConfirmation) {
    // Initial success message (matching first screenshot)
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-card-foreground mb-2">
            You have successfully registered for <span className="text-yellow-600">{eventName || 'the event'}</span>
          </h1>
          
          {/* Email Status */}
          <div className="mt-4 mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-sm">
              <Mail className="w-4 h-4" />
              <span>
                {emailSent 
                  ? 'Your confirmation email with e-badge has been sent!' 
                  : 'Your confirmation email is being prepared...'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-8">
            <Button
              onClick={() => setShowConfirmation(true)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg text-base"
            >
              SHOW CONFIRMATION
            </Button>

            <Button
              onClick={() => setShowConfirmation(true)}
              variant="outline"
              className="w-full border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-semibold py-3 px-6 rounded-lg text-base"
            >
              FILL A NEW FORM
            </Button>
          </div>

          {/* Footer Link */}
          <button
            onClick={() => navigate('/')}
            className="mt-6 text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Evella Home
          </button>
        </Card>
      </div>
    );
  }

  // Confirmation page with badge (matching second screenshot)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Your Event Confirmation {eventName || 'the event'}
          </h1>
        </div>

        {/* Badge Card */}
        <Card 
          ref={badgeCardRef}
          className="bg-gradient-to-br from-card via-muted/50 to-yellow-500/10 dark:to-yellow-900/20 rounded-3xl shadow-2xl p-0 mb-8 border-0 overflow-hidden"
        >
          <div className="flex flex-col md:flex-row gap-0 md:gap-10 items-stretch">
            {/* Badge Preview - Use Badge component if data available, otherwise fallback */}
            <div
              ref={badgeRef}
              className="flex-shrink-0 flex items-center justify-center p-6"
              style={{ width: '320px', minHeight: '380px' }}
            >
              {loadingBadge ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Loading badge...</p>
                </div>
              ) : badgeData?.badge ? (
                <div className="transform scale-75 origin-center">
                  <Badge 
                    attendee={{
                      id: Number(attendeeId),
                      guest: {
                        name: badgeData.badge?.name || badgeData.attendee?.guest_name || guestName || '',
                        email: badgeData.attendee?.guest_email || guestEmail || '',
                        company: badgeData.badge?.company || guestCompany || '',
                        jobtitle: badgeData.badge?.jobTitle || guestJobTitle || '',
                        uuid: badgeData.badge?.uuid || guestUuid || '',
                      },
                      guest_type: {
                        name: badgeData.badge?.guestType || badgeData.attendee?.guest_type || guestTypeName || 'Visitor'
                      }
                    } as any}
                  />
                </div>
              ) : (
                // Fallback badge preview
                <div className="flex-shrink-0 bg-gradient-to-br from-yellow-400/80 via-yellow-100 to-white border-0 rounded-2xl p-0 shadow-none relative flex flex-col items-center justify-between w-full h-full">
                  <div className="w-full flex justify-between items-center px-6 pt-6">
                    <img
                      src="/evella-logo.png"
                      alt="Evella Logo"
                      className="w-30 h-12 object-contain"
                    />
                    <span className="inline-flex items-center justify-center bg-yellow-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm h-8">
                      {guestTypeName || 'Visitor'}
                    </span>
                  </div>
                  <div className="w-full text-center mt-4 mb-3 px-6">
                    <h3 className="text-2xl font-extrabold text-foreground tracking-tight uppercase">
                      {eventName?.toUpperCase() || 'EVENT'}
                    </h3>
                  </div>
                  <div className="w-full text-center mb-4 px-6">
                    <p className="text-3xl font-extrabold text-card-foreground tracking-tight">
                      {guestName || 'Guest'}
                    </p>
                  </div>
                  <div className="flex justify-center w-full mb-4">
                    <div className="bg-card/90 dark:bg-card/80 p-3 rounded-xl shadow-lg border border-yellow-200 dark:border-yellow-700/50">
                      <QRCodeSVG
                        value={guestUuid || attendeeId || 'NO-DATA'}
                        size={100}
                        level="M"
                        marginSize={0}
                      />
                    </div>
                  </div>
                  <div className="w-full text-center pb-4 px-6">
                    <span className="text-xs text-muted-foreground tracking-widest font-mono">
                      #{attendeeId}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Event Info */}
            <div className="flex-grow flex flex-col justify-center bg-card/80 dark:bg-card/70 rounded-r-3xl p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-1">Event</h3>
                  <p className="text-xl font-bold text-card-foreground">{eventName}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Date
                    </h3>
                    <p className="text-base font-semibold text-card-foreground">
                      {formatDate(eventDate)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Time
                    </h3>
                    <p className="text-base font-semibold text-card-foreground">
                      {formatTime(eventTime)}
                    </p>
                  </div>
                </div>
                {eventLocation && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h3>
                    <p className="text-base font-semibold text-card-foreground">{eventLocation}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-card-foreground">Guest:</span> {guestName}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Attendee ID: <span className="font-mono">{attendeeId}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Registration Details Section */}
        <Card className="bg-card rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Registration Details</h2>
            <p className="text-muted-foreground">Complete information about your registration</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <p className="text-base font-semibold text-card-foreground">{guestName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <p className="text-base font-semibold text-card-foreground">{guestEmail || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <p className="text-base font-semibold text-card-foreground">{guestPhone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gender</label>
                  <p className="text-base font-semibold text-card-foreground">{guestGender || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Country</label>
                  <p className="text-base font-semibold text-card-foreground">{guestCountry || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Professional Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Company</label>
                  <p className="text-base font-semibold text-card-foreground">{guestCompany || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Job Title</label>
                  <p className="text-base font-semibold text-card-foreground">{guestJobTitle || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Guest Type</label>
                  <p className="text-base font-semibold text-card-foreground">{guestTypeName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Registration Fee</label>
                  <p className="text-base font-semibold text-card-foreground">
                    {guestTypePrice && parseFloat(guestTypePrice) > 0 
                      ? `$${parseFloat(guestTypePrice).toFixed(2)}` 
                      : 'Free'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Registration ID</label>
                  <p className="text-base font-semibold text-card-foreground font-mono">{attendeeId || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleDownloadBadge}
              disabled={downloading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-lg text-base inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download e-Badge
                </>
              )}
            </Button>
            
            <Button
              onClick={handleResendEmail}
              disabled={resendingEmail}
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold py-3 px-8 rounded-lg text-base inline-flex items-center gap-2"
            >
              {resendingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  RESEND EMAIL
                </>
              )}
            </Button>
          </div>
          
          {emailSent && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Check your email ({guestEmail}) for the confirmation with e-badge attachment
            </p>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 dark:text-blue-300 text-sm font-semibold mb-1">
                E-Badge Ready!
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                Your digital visitor badge has been generated and sent to your email. You can download it above or check your inbox for the PDF attachment. The badge includes a QR code for seamless check-in at the event.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

