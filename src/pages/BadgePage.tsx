import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
// Note: Dynamic sizing is handled in the Badge component, templates use base sizes
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

const BadgePage = () => {
  const { eventId, attendeeId } = useParams();
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<BadgeTemplate | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  const badgeRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = async () => {
    setTimeout(() => {
      if (badgeRef.current) {
        const badgeElement = badgeRef.current.querySelector('.printable-badge');
        if (!badgeElement) {
          console.error('No badge found to print.');
          return;
        }
        // Make sure the print area is visible and positioned correctly
        badgeRef.current.style.visibility = 'visible';
        badgeRef.current.style.position = 'absolute';
        badgeRef.current.style.left = '0';
        badgeRef.current.style.top = '0';
        badgeRef.current.style.width = '100vw';
        badgeRef.current.style.height = '100vh';
        badgeRef.current.style.zIndex = '9999';
        badgeRef.current.style.background = 'white';
        
        // Wait a bit more for badge to render, then print
        setTimeout(() => {
          window.print();
          // Reset the print area after printing
          badgeRef.current!.style.visibility = 'hidden';
        }, 500);
      }
    }, 300);
  };

  useEffect(() => {
    if (!attendeeId || !eventId) return;
    setLoading(true);
    api.get(`/events/${eventId}/attendees/${attendeeId}`)
      .then(response => {
        setAttendee(response.data);
      })
      .catch(() => setError('Failed to fetch attendee data.'))
      .finally(() => setLoading(false));
  }, [attendeeId, eventId]);

  useEffect(() => {
    if (!eventId) return;
    setTemplateError(null);
    
    // First try to get the official template
    getOfficialBadgeTemplate(Number(eventId))
      .then(res => {
        setTemplate(res.data);
      })
      .catch(() => {
        // If no official template, try to get any template
        getBadgeTemplates(Number(eventId))
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
  }, [eventId]);

  // Always use the default badge design for every event
  if (loading) return <div className="p-8 text-center">Loading Badge...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!attendee) return <div className="p-8 text-center">No attendee data.</div>;

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0; }
          body { background-color: #FFF; }
          .no-print { display: none; }
          .printable-badge {
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
        `}
      </style>
      <div className="no-print mb-4">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print Badge
        </Button>
      </div>
      <div ref={badgeRef} className="printable-badge">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #single-badge-page-print-area, #single-badge-page-print-area * { visibility: visible !important; }
            #single-badge-page-print-area { 
              position: absolute !important; 
              left: 0; 
              top: 0; 
              width: 100vw; 
              height: 100vh; 
              background: white; 
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        `}</style>
        <div id="single-badge-page-print-area">
          <Badge attendee={attendee} />
        </div>
      </div>
    </div>
  );
};

export default BadgePage; 