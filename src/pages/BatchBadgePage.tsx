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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Default template for demonstration - moved to a function
const createDefaultTemplate = (): BadgeTemplate => ({
  id: 0,
  event_id: 0,
  name: 'Default Conference Badge',
  template_json: {
    front: {
      elements: [
        { id: uuidv4(), type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 396, height: 100, rotation: 0, zIndex: 1, backgroundColor: '#10B981', borderColor: '#10B981', borderWidth: 0 },
        { id: uuidv4(), type: 'text', content: 'VEMSCON 2024', x: 20, y: 20, width: 356, height: 40, rotation: 0, zIndex: 2, fontFamily: 'Arial', fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
        { id: uuidv4(), type: 'image', src: '{profilePicture}', x: 148, y: 120, width: 100, height: 100, rotation: 0, zIndex: 2 },
        { id: uuidv4(), type: 'text', content: '{fullName}', x: 20, y: 240, width: 356, height: 30, rotation: 0, zIndex: 2, fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center' },
        { id: uuidv4(), type: 'text', content: '{jobTitle}', x: 20, y: 280, width: 356, height: 20, rotation: 0, zIndex: 2, fontFamily: 'Arial', fontSize: 18, fontWeight: 'normal', color: '#6B7280', textAlign: 'center' },
        { id: uuidv4(), type: 'text', content: '{company}', x: 20, y: 310, width: 356, height: 20, rotation: 0, zIndex: 2, fontFamily: 'Arial', fontSize: 18, fontWeight: 'normal', color: '#6B7280', textAlign: 'center' },
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