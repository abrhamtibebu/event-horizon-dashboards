import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { downloadTicketPDF } from '@/lib/api/tickets';
import { toast } from 'sonner';

interface TicketDownloadButtonProps {
  ticketId: number;
  ticketNumber: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TicketDownloadButton({
  ticketId,
  ticketNumber,
  variant = 'outline',
  size = 'default',
  className,
}: TicketDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadTicketPDF(ticketId);
      toast.success('Ticket PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download ticket:', error);
      toast.error('Failed to download ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Ticket
        </>
      )}
    </Button>
  );
}

