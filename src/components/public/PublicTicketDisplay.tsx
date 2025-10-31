import { CheckCircle, Download, Mail, Ticket as TicketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

interface PurchasedTicket {
  id: number;
  ticket_number: string;
  qr_code: string;
  ticket_type_name: string;
  price_paid: number;
}

interface PublicTicketDisplayProps {
  tickets: PurchasedTicket[];
  event: {
    name: string;
    start_date: string;
    location: string;
  };
  guestInfo: {
    name: string;
    email: string;
  };
}

export function PublicTicketDisplay({ tickets, event, guestInfo }: PublicTicketDisplayProps) {
  const handleDownloadTicket = async (ticketId: number) => {
    try {
      // This would call the API to download the PDF
      window.open(`/api/tickets/${ticketId}/download`, '_blank');
    } catch (error) {
      console.error('Failed to download ticket:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h2>
        <p className="text-lg text-gray-600 mb-1">
          Thank you for your purchase, {guestInfo.name}!
        </p>
        <p className="text-sm text-gray-500">
          Your tickets have been sent to {guestInfo.email}
        </p>
      </div>

      {/* Email Confirmation Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Check Your Email
            </h3>
            <p className="text-sm text-blue-700">
              We've sent a confirmation email with all your ticket details, including QR codes and event information. 
              Please check your inbox and spam folder.
            </p>
          </div>
        </div>
      </div>

      {/* Event Details Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Event Details</h3>
        <div className="space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-600">Event:</span>
            <span className="font-semibold">{event.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-semibold">{formatDate(event.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-semibold">{event.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tickets:</span>
            <span className="font-semibold">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
        </div>
      </div>

      {/* Tickets Display */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TicketIcon className="w-6 h-6 text-yellow-600" />
          Your Tickets
        </h3>
        
        {tickets.map((ticket, index) => (
          <div
            key={ticket.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* QR Code */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                    <QRCodeSVG
                      value={ticket.ticket_number}
                      size={150}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scan at entrance</p>
                </div>

                {/* Ticket Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Ticket #{index + 1}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Confirmed
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {ticket.ticket_type_name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Ticket Number:</span>
                      <p className="font-mono font-semibold text-gray-900">
                        {ticket.ticket_number}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Price Paid:</span>
                      <p className="font-semibold text-gray-900">
                        ETB {ticket.price_paid.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Attendee:</span>
                      <p className="font-semibold text-gray-900">{guestInfo.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-semibold text-gray-900 truncate">
                        {guestInfo.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <Button
                      onClick={() => handleDownloadTicket(ticket.id)}
                      variant="outline"
                      size="sm"
                      className="w-full md:w-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Ticket PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-yellow-900 mb-3">Important Information</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">•</span>
            <span>
              Please bring either a printed ticket or show the QR code on your mobile device at the event entrance.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">•</span>
            <span>
              Each ticket is valid for one person only and can be scanned once.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">•</span>
            <span>
              Save your tickets to your device or take screenshots for offline access.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-1">•</span>
            <span>
              For any questions or issues, please contact the event organizer.
            </span>
          </li>
        </ul>
      </div>

      {/* Thank You Message */}
      <div className="text-center text-gray-600 py-4">
        <p className="text-lg">
          We look forward to seeing you at the event! 🎉
        </p>
      </div>
    </div>
  );
}

