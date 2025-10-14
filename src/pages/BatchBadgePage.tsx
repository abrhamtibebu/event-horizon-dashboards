import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import api from '@/lib/api';
import Badge from '@/components/Badge';
import { BadgeTemplate } from '@/types/badge';
import { Attendee } from '@/types/attendee';
import { v4 as uuidv4 } from 'uuid';
import { getBadgeTemplates, getOfficialBadgeTemplate } from '@/lib/badgeTemplates';
import { calculateNameFontSize, calculateCompanyFontSize, calculateJobTitleFontSize } from '@/lib/nameSizing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Default template for demonstration - Updated for 4"x4" (100mm x 100mm) without header/footer
const createDefaultTemplate = (): BadgeTemplate => ({
  id: 0,
  event_id: 0,
  name: 'Default Conference Badge 4x4 Clean',
  template_json: {
    front: {
      elements: [
        { id: uuidv4(), type: 'text', content: '{fullName}', x: 20, y: 50, width: 360, height: 60, rotation: 0, zIndex: 2, fontFamily: 'Helvetica', fontSize: 36, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
        { id: uuidv4(), type: 'text', content: '{company}', x: 20, y: 120, width: 360, height: 30, rotation: 0, zIndex: 2, fontFamily: 'Helvetica', fontSize: 20, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
        { id: uuidv4(), type: 'text', content: '{jobTitle}', x: 20, y: 155, width: 360, height: 25, rotation: 0, zIndex: 2, fontFamily: 'Helvetica', fontSize: 18, fontWeight: 'bold', color: '#64748b', textAlign: 'center' },
        { id: uuidv4(), type: 'shape', shapeType: 'rectangle', x: 130, y: 200, width: 140, height: 140, rotation: 0, zIndex: 2, backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 2 },
        { id: uuidv4(), type: 'text', content: 'QR CODE', x: 130, y: 250, width: 140, height: 20, rotation: 0, zIndex: 3, fontFamily: 'Helvetica', fontSize: 14, fontWeight: 'bold', color: '#64748b', textAlign: 'center' },
        { id: uuidv4(), type: 'text', content: 'ID: {uuid}', x: 20, y: 350, width: 360, height: 25, rotation: 0, zIndex: 2, fontFamily: 'Helvetica', fontSize: 14, fontWeight: 'bold', color: '#64748b', textAlign: 'center' },
        { id: uuidv4(), type: 'text', content: '{guestType}', x: 20, y: 375, width: 360, height: 25, rotation: 0, zIndex: 2, fontFamily: 'Helvetica', fontSize: 22, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
      ],
      background: null
    },
    back: {
      elements: [],
      background: null
    }
  },
  status: 'official',
});

const BatchBadgePage = () => {
  const [searchParams] = useSearchParams();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<BadgeTemplate | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = async () => {
    setTimeout(() => {
      if (printRef.current) {
        const badgeElements = Array.from(printRef.current.querySelectorAll('.printable-badge-batch'));
        if (badgeElements.length === 0) {
          console.error('No badges found to print.');
          return;
        }
        // Make sure the print area is visible and positioned correctly
        printRef.current.style.visibility = 'visible';
        printRef.current.style.position = 'absolute';
        printRef.current.style.left = '0';
        printRef.current.style.top = '0';
        printRef.current.style.width = '100vw';
        printRef.current.style.height = '100vh';
        printRef.current.style.zIndex = '9999';
        printRef.current.style.background = 'white';
        
        // Wait a bit more for badges to render, then print
        setTimeout(() => {
          window.print();
          // Reset the print area after printing
          printRef.current!.style.visibility = 'hidden';
        }, 500);
      }
    }, 300);
  };

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (!ids) {
      setError('No attendee IDs provided.');
      setLoading(false);
      return;
    }
    
    // This assumes an endpoint that can take multiple IDs.
    // e.g., /api/attendees/batch?ids=1,2,3
    // We will need to create this endpoint.
    api.get(`/attendees/batch?ids=${ids}`)
      .then(response => {
        setAttendees(response.data);
      })
      .catch(() => setError('Failed to fetch attendee data.'))
      .finally(() => setLoading(false));

  }, [searchParams]);

  useEffect(() => {
    if (attendees.length === 0) return;
    const eventId = attendees[0]?.event_id;
    if (!eventId) return;
    setTemplateError(null);
    
    // First try to get the official template
    getOfficialBadgeTemplate(eventId)
      .then(res => {
        setTemplate(res.data);
      })
      .catch(() => {
        // If no official template, try to get any template
        getBadgeTemplates(eventId)
          .then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
              setTemplate(res.data[0]);
            } else {
              setTemplate(createDefaultTemplate());
              setTemplateError('No badge templates found. Using default template.');
            }
          })
          .catch(() => {
            // fallback to localStorage
            const saved = localStorage.getItem(`badge_templates_${eventId}`);
            if (saved) {
              const templates = JSON.parse(saved);
              setTemplate(templates[0]);
            } else {
              setTemplate(createDefaultTemplate());
              setTemplateError('Failed to load badge template from backend and local storage. Using default.');
            }
          });
      });
  }, [attendees]);

  if (loading) return <div className="p-8 text-center">Loading Badges...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (attendees.length === 0) return <div className="p-8 text-center">No attendees found for the provided IDs.</div>;
  if (!template) return <div className="p-8 text-center text-red-500">No badge template found.</div>;

  return (
    <div className="bg-gray-100">
       <style type="text/css" media="print">
        {`
          @page { size: A6; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
          .printable-badge-batch {
            page-break-after: always;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
           .printable-badge-batch:last-child {
            page-break-after: auto;
          }
        `}
      </style>
       <div className="no-print p-4 text-center">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print Selected Badges
        </Button>
      </div>
      {templateError && <div className="mb-2 text-red-500">{templateError}</div>}
      <div ref={printRef}>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #batch-page-print-area, #batch-page-print-area * { visibility: visible !important; }
            #batch-page-print-area { 
              position: absolute !important; 
              left: 0; 
              top: 0; 
              width: 100vw; 
              height: 100vh; 
              background: white; 
            }
            .printable-badge-batch {
              page-break-after: always;
              margin: 0;
              padding: 0;
              border: none;
              box-shadow: none;
            }
            .printable-badge-batch:last-child {
              page-break-after: auto;
            }
          }
        `}</style>
        <div id="batch-page-print-area">
          {attendees.map(attendee => (
            <div key={attendee.id} className="printable-badge-batch">
              <Badge attendee={attendee} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BatchBadgePage; 