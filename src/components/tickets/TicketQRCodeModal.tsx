import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import type { Ticket } from '@/types';

interface TicketQRCodeModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketQRCodeModal({ ticket, open, onOpenChange }: TicketQRCodeModalProps) {
  if (!ticket) return null;

  const downloadQRCode = () => {
    const canvas = document.getElementById('ticket-qr-code') as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `ticket-${ticket.ticket_number}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ticket QR Code</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <QRCodeSVG
              id="ticket-qr-code"
              value={ticket.ticket_number}
              size={256}
              level="H"
              includeMargin
            />
          </div>

          {/* Ticket Info */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Ticket #{ticket.ticket_number}</p>
            {ticket.event && (
              <p className="text-xs text-muted-foreground">{ticket.event.title}</p>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center text-xs text-muted-foreground max-w-xs">
            Present this QR code at the event entrance for validation
          </div>

          {/* Download Button */}
          <Button variant="outline" onClick={downloadQRCode} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

