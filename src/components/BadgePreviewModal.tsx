import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Badge from './Badge';
import { Attendee } from '@/types/attendee';

interface BadgePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendee: Attendee | null;
  eventName?: string;
}

const BadgePreviewModal: React.FC<BadgePreviewModalProps> = ({
  open,
  onOpenChange,
  attendee,
  eventName
}) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handleDownloadPDF = async () => {
    if (!badgeRef.current || !attendee) {
      toast.error('Badge not ready. Please try again.');
      return;
    }

    setDownloading(true);
    try {
      // Capture the badge with high quality
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: badgeRef.current.scrollWidth,
        height: badgeRef.current.scrollHeight,
      });

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Convert to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate PDF dimensions (4"x4" = 101.6mm x 101.6mm)
      const pdfSize = 101.6; // mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfSize, pdfSize],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfSize, pdfSize);
      
      const fileName = `${attendee.guest?.name?.replace(/\s+/g, '-') || 'badge'}-${eventName?.replace(/\s+/g, '-') || 'event'}.pdf`;
      pdf.save(fileName);

      toast.success('Badge downloaded successfully!');
    } catch (error) {
      console.error('Error downloading badge:', error);
      toast.error('Failed to download badge. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!badgeRef.current || !attendee) {
      toast.error('Badge not ready. Please try again.');
      return;
    }

    setPrinting(true);
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print the badge.');
        return;
      }

      // Capture badge as image
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create print-friendly HTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Badge - ${attendee.guest?.name || 'Event Badge'}</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .badge-container {
                  width: 4in;
                  height: 4in;
                  margin: 0 auto;
                  page-break-inside: avoid;
                }
                img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
              }
              @page {
                size: 4in 4in;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="badge-container">
              <img src="${imgData}" alt="Event Badge" />
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing badge:', error);
      toast.error('Failed to print badge. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  if (!attendee) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Your Event Badge</DialogTitle>
          <DialogDescription>
            Preview and download your personalized event badge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badge Preview */}
          <div className="flex justify-center items-center bg-muted/30 rounded-lg p-8 min-h-[400px]">
            <div ref={badgeRef} className="printable-badge">
              <Badge attendee={attendee} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg inline-flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </Button>

            <Button
              onClick={handlePrint}
              disabled={printing}
              variant="outline"
              className="border-2 font-semibold py-3 px-6 rounded-lg inline-flex items-center gap-2"
            >
              {printing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  Print Badge
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Save the PDF to your mobile device or print it before the event. 
              The QR code on your badge will be scanned for quick check-in.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgePreviewModal;
