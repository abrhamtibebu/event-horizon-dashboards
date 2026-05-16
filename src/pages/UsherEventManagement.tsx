import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  Calendar,
  Users,
  UserPlus,
  Printer,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  CheckCircle,
  X,
  Plus,
  FileText,
  QrCode,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { getGuestTypeBadgeClasses, getCheckInBadgeClasses } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'
import { DashboardCard } from '@/components/DashboardCard'
import BadgePrint from '@/components/Badge'
import BadgeTest from '@/components/BadgeTest'
import {
  getOfficialBadgeTemplate,
  getBadgeTemplates,
} from '@/lib/badgeTemplates'
import { BadgeTemplate } from '@/types/badge'
import PrintBadgeTemplateDialog, { type PrintBadgeTemplateChoice } from '@/components/PrintBadgeTemplateDialog'
import React, { Suspense } from 'react'
import Papa from 'papaparse';
import { postAttendeesBatch } from '@/lib/api';
import { generateSingleBadgePDF, generateBatchBadgePDF, printPDFBlob, waitForElement } from '@/lib/badgeUtils';
import { BadgeAssignmentDialog } from '@/components/BadgeAssignmentDialog';
import { QRScanner } from '@/components/checkin/QRScanner';
import { checkInByQR } from '@/lib/api';
import { UsherMobileLayout } from '@/components/UsherMobileLayout'


export default function UsherEventManagement() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning, showInfo } = useModernAlerts()
  const { user } = useAuth()

  // Event data
  const [eventData, setEventData] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)

  // Attendees
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(true)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)
  const [guestTypes, setGuestTypes] = useState<any[]>([])

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [guestTypeFilter, setGuestTypeFilter] = useState('all')
  const [checkedInFilter, setCheckedInFilter] = useState('all')

  // Selected attendees for batch operations
  const [selectedAttendees, setSelectedAttendees] = useState<Set<number>>(
    new Set()
  )

  // Add attendee dialog
  const [assignBadgeDialogOpen, setAssignBadgeDialogOpen] = useState(false)
  const [addAttendeeDialogOpen, setAddAttendeeDialogOpen] = useState(false)
  const [addAttendeeForm, setAddAttendeeForm] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    jobtitle: '',
    gender: '',
    country: '',
    guest_type_id: '',
    badge_code: '',
  })
  const [addAttendeeLoading, setAddAttendeeLoading] = useState(false)
  const [badgeCode, setBadgeCode] = useState('')
  const [validationStatus, setValidationStatus] = useState<{
    email: 'idle' | 'checking' | 'valid' | 'invalid' | 'duplicate';
    phone: 'idle' | 'checking' | 'valid' | 'invalid' | 'duplicate';
  }>({
    email: 'idle',
    phone: 'idle'
  });
  const [existingGuestInfo, setExistingGuestInfo] = useState<any>(null);

  // Badge printing
  const [badgeTemplate, setBadgeTemplate] = useState<BadgeTemplate | null>(null)
  const [singlePrintAttendee, setSinglePrintAttendee] = useState<any>(null)
  const [printing, setPrinting] = useState(false)
  const [showTestBadge, setShowTestBadge] = useState(false)
  const [testAttendee, setTestAttendee] = useState<any>(null)
  const [printTemplateDialogOpen, setPrintTemplateDialogOpen] = useState(false)
  const [printTemplateChoice, setPrintTemplateChoice] = useState<PrintBadgeTemplateChoice>('assigned')
  const [pendingPrintKind, setPendingPrintKind] = useState<'single' | 'batch' | null>(null)
  const [pendingSingleAttendee, setPendingSingleAttendee] = useState<any>(null)


  // CSV Upload State
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<any[]>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvFailure, setCsvFailure] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvHeaderMap, setCsvHeaderMap] = useState<Record<string, string>>({});
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvUnmatchedCount, setCsvUnmatchedCount] = useState<number>(0);

  // Attendee removal state
  const [removeAttendeeDialogOpen, setRemoveAttendeeDialogOpen] = useState(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState<any>(null);
  const [removeAttendeeLoading, setRemoveAttendeeLoading] = useState(false);

  // QR Scanner state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);

  const requiredHeaders = [
    'name',
    'email',
    'phone',
    'company',
    'jobtitle',
    'gender',
    'country',
    'guest_type_name',
  ];

  const handleDownloadSampleCSV = () => {
    const sample =
      'name,email,phone,company,jobtitle,gender,country,guest_type_name\n' +
      'John Doe,john@example.com,1234567890,Acme Corp,Manager,Male,USA,VIP\n';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-attendees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkExistingGuest = async (email: string, phone: string) => {
    if (!eventId || (!email && !phone)) return;
    
    try {
      setValidationStatus(prev => ({ ...prev, email: 'checking', phone: 'checking' }));
      
      const response = await api.post(`/events/${eventId}/attendees/check-guest`, {
        email: email || '',
        phone: phone || ''
      });
      
      const { exists, already_registered, guest_info } = response.data;
      
      if (exists) {
        if (already_registered) {
          setValidationStatus(prev => ({ ...prev, email: 'duplicate', phone: 'duplicate' }));
          showError('Already Registered', 'This guest is already registered for this event.');
        } else {
          setValidationStatus(prev => ({ ...prev, email: 'duplicate', phone: 'duplicate' }));
          setExistingGuestInfo(guest_info);
          showInfo('Existing Guest Found', 'We found an existing guest with this email/phone. We will update their information.');
        }
      } else {
        setValidationStatus(prev => ({ ...prev, email: 'valid', phone: 'valid' }));
        setExistingGuestInfo(null);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, email: 'invalid', phone: 'invalid' }));
    }
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvSuccess(null);
    setCsvFailure(null);
    setCsvErrors([]);
    setCsvRows([]);
    setCsvFileName(null);
    setCsvHeaderMap({});
    setCsvPreviewRows([]);
    setCsvUnmatchedCount(0);
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const errors: any[] = [];
        // Check headers
        const rawHeaders = (results.meta.fields || []) as string[];
        const headers = rawHeaders.map((h: any) => String(h).trim().toLowerCase());
        // Build a header map for common variants to required header names
        const headerMap: Record<string, string> = {};
        headers.forEach((h, idx) => {
          let mapped = h
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .toLowerCase();
          // heuristics
          if (mapped === 'guesttype' || mapped === 'type' || mapped === 'guest_type') mapped = 'guest_type_name';
          if (mapped === 'job' || mapped === 'title' || mapped === 'job_title') mapped = 'jobtitle';
          headerMap[rawHeaders[idx]] = mapped;
        });
        // verify coverage
        const normalizedSet = new Set(Object.values(headerMap));
        const missingHeaders = requiredHeaders.filter((h) => !normalizedSet.has(h));
        if (missingHeaders.length > 0) {
          setCsvErrors([{ row: 'Header', error: `Missing headers: ${missingHeaders.join(', ')}` }]);
          // Continue to allow user to map, but flag error
        }
        // Normalize rows: trim keys/values and lowercase header keys
        const normalizedRows = rows.map((row) => {
          const entryPairs = Object.entries(row).map(([k, v]) => {
            const rawKey = String(k);
            const key = headerMap[rawKey] || String(rawKey).trim().toLowerCase();
            const value = typeof v === 'string' ? v.trim() : v;
            return [key, value];
          });
          return Object.fromEntries(entryPairs);
        });

        // Validate rows
        const validatedRows = normalizedRows.map((row, idx) => {
          const rowErrors: string[] = [];
          requiredHeaders.forEach((h) => {
            if (!row[h] && ['name', 'email', 'guest_type_name'].includes(h)) {
              rowErrors.push(`${h} is required`);
            }
          });
          if (row.email && !validateEmail(String(row.email))) {
            rowErrors.push('Invalid email format');
          }
          // Optionally: validate phone, gender, etc.
          if (rowErrors.length > 0) {
            errors.push({ row: idx + 2, error: rowErrors.join('; ') });
          }
          return row;
        });
        setCsvRows(validatedRows);
        setCsvHeaderMap(headerMap);
        setCsvPreviewRows(validatedRows.slice(0, 10));
        setCsvErrors(errors);
      },
      error: (err) => {
        setCsvErrors([{ row: 'File', error: err.message }]);
      },
    });
  };

  const handleUploadCSV = async () => {
    setCsvLoading(true);
    setCsvSuccess(null);
    setCsvFailure(null);
    // Only send valid rows
    const validRows = csvRows.filter((row, idx) =>
      !csvErrors.some((err) => err.row === idx + 2)
    );
    if (validRows.length === 0) {
      setCsvFailure('No valid rows to upload.');
      setCsvLoading(false);
      return;
    }
    if (!guestTypes || guestTypes.length === 0) {
      setCsvFailure('Guest types are not loaded for this event. Please try again in a moment.');
      setCsvLoading(false);
      return;
    }
    // Map guest_type_name to guest_type_id
    const guestTypeMap: Record<string, string> = {};
    guestTypes.forEach((gt: any) => {
      if (gt && gt.name != null && gt.id != null) {
        guestTypeMap[String(gt.name).trim().toLowerCase()] = String(gt.id);
      }
    });
    const attendees = validRows.map((row) => {
      const name = typeof row.name === 'string' ? row.name.trim() : row.name;
      const email = typeof row.email === 'string' ? row.email.trim() : row.email;
      const phone = typeof row.phone === 'string' ? row.phone.trim() : row.phone;
      const company = typeof row.company === 'string' ? row.company.trim() : row.company;
      const jobtitle = typeof row.jobtitle === 'string' ? row.jobtitle.trim() : row.jobtitle;
      const gender = typeof row.gender === 'string' ? row.gender.trim() : row.gender;
      const country = typeof row.country === 'string' ? row.country.trim() : row.country;
      const guestTypeName = typeof row.guest_type_name === 'string' ? row.guest_type_name.trim().toLowerCase() : '';
      const explicitGuestTypeId = row.guest_type_id != null ? String(row.guest_type_id).trim() : '';
      const mappedGuestTypeId = explicitGuestTypeId || guestTypeMap[guestTypeName] || '';
      return {
        name,
        email,
        phone,
        company,
        jobtitle,
        gender,
        country,
        guest_type_id: mappedGuestTypeId,
      };
    });
    // Remove rows with missing guest_type_id
    const finalAttendees = attendees.filter((a) => a.guest_type_id);
    if (finalAttendees.length === 0) {
      setCsvFailure('Some rows have invalid data. Make sure all rows have name, email, and a valid guest type.');
      setCsvLoading(false);
      return;
    }
    try {
      const res = await postAttendeesBatch(eventId, finalAttendees);
      setCsvSuccess(`Successfully uploaded ${res.data.created.length} attendees.`);
      if (res.data.errors && res.data.errors.length > 0) {
        setCsvErrors(res.data.errors.map((err: any) => ({ row: err.email, error: err.error })));
      } else {
        setCsvErrors([]);
      }
      setAttendees((prev) => [...prev, ...res.data.created]);
    } catch (err: any) {
      setCsvFailure(err.response?.data?.error || 'Failed to upload attendees.');
    } finally {
      setCsvLoading(false);
    }
  };

  const singlePrintRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleSinglePrint = useReactToPrint({
    contentRef: singlePrintRef,
    onAfterPrint: () => {
      setSinglePrintAttendee(null)
      if (singlePrintRef.current) {
        singlePrintRef.current.style.visibility = 'hidden'
      }
    },
    onPrintError: (error) => {
      console.error('Single print error:', error)
      showError('Print Error', 'Failed to print badge. Please try again.')
      setSinglePrintAttendee(null)
      if (singlePrintRef.current) {
        singlePrintRef.current.style.visibility = 'hidden'
      }
    },
  })

  const handlePrintBadges = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      setPrinting(false)
      if (printRef.current) {
        printRef.current.style.visibility = 'hidden'
      }
    },
    onPrintError: (error) => {
      console.error('Batch print error:', error)
      showError('Print Error', 'Failed to print badges. Please try again.')
      setPrinting(false)
      if (printRef.current) {
        printRef.current.style.visibility = 'hidden'
      }
    },
  })

  // Fetch event data
  useEffect(() => {
    if (!eventId) return

    const fetchEventData = async () => {
      try {
        setEventLoading(true)
        const response = await api.get(`/events/${eventId}`)
        setEventData(response.data)
        setEventError(null)
      } catch (err: any) {
        setEventError(err.response?.data?.error || 'Failed to fetch event data')
        console.error(err)
      } finally {
        setEventLoading(false)
      }
    }

    fetchEventData()
  }, [eventId])

  // Debounce search term for faster, non-janky filtering
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(handle)
  }, [searchTerm])

  // Reusable function to fetch attendees with current filters
  const fetchAttendeesWithFilters = useCallback(async (searchTermToUse?: string, guestTypeToUse?: string, checkedInToUse?: string) => {
    if (!eventId) return

    try {
      setAttendeesLoading(true)
      const effectiveSearch = searchTermToUse ?? debouncedSearchTerm
      const effectiveGuestType = guestTypeToUse ?? guestTypeFilter
      const effectiveCheckedIn = checkedInToUse ?? checkedInFilter
      
      let allAttendees: any[] = []
      
      // When searching, fetch ALL pages to get all matching results
      // The backend caps per_page at 100, so we need to paginate through all results
      if (effectiveSearch) {
        let currentPage = 1
        let hasMorePages = true
        const perPage = 100 // Use max allowed per_page from backend
        
        while (hasMorePages) {
          const params = new URLSearchParams()
          params.append('page', currentPage.toString())
          params.append('per_page', perPage.toString())
          params.append('search', effectiveSearch)
          
          // Add filters
          if (effectiveGuestType !== 'all') {
            params.append('guest_type', effectiveGuestType)
          }
          
          if (effectiveCheckedIn !== 'all') {
            params.append('checked_in', effectiveCheckedIn === 'checked-in' ? 'true' : 'false')
          }
          
          const response = await api.get(`/events/${eventId}/attendees?${params.toString()}`)
          
          // Handle paginated response
          let pageData: any[] = []
          if (response.data?.data) {
            // Paginated response
            pageData = response.data.data
            const totalPages = response.data.last_page || 1
            hasMorePages = currentPage < totalPages
          } else if (Array.isArray(response.data)) {
            // Non-paginated array response
            pageData = response.data
            hasMorePages = false
          } else {
            // Single object or unexpected format
            hasMorePages = false
          }
          
          allAttendees = [...allAttendees, ...pageData]
          
          if (hasMorePages) {
            currentPage++
          }
        }
      } else {
        // Non-search: use default pagination
        const params = new URLSearchParams()
        params.append('per_page', '100') // Use max allowed
        
        // Add filters
        if (effectiveGuestType !== 'all') {
          params.append('guest_type', effectiveGuestType)
        }
        
        if (effectiveCheckedIn !== 'all') {
          params.append('checked_in', effectiveCheckedIn === 'checked-in' ? 'true' : 'false')
        }
        
        const response = await api.get(`/events/${eventId}/attendees?${params.toString()}`)
        // Handle paginated response
        allAttendees = response.data?.data ? response.data.data : (Array.isArray(response.data) ? response.data : [])
      }
      
      // Precompute a lowercase search blob for faster includes matching
      const indexed = allAttendees.map((a: any) => {
        const name = a?.guest?.name ? String(a.guest.name) : ''
        const email = a?.guest?.email ? String(a.guest.email) : ''
        const company = a?.guest?.company ? String(a.guest.company) : ''
        const blob = `${name} ${email} ${company}`.toLowerCase()
        return { ...a, _search: blob }
      })
      
      setAttendees(indexed)
      setAttendeesError(null)
    } catch (err: any) {
      setAttendeesError(
        err.response?.data?.error || 'Failed to fetch attendees'
      )
      console.error(err)
    } finally {
      setAttendeesLoading(false)
    }
  }, [eventId, debouncedSearchTerm, guestTypeFilter, checkedInFilter])

  // Fetch attendees
  useEffect(() => {
    fetchAttendeesWithFilters()
  }, [fetchAttendeesWithFilters])

  // Fetch guest types
  useEffect(() => {
    if (!eventId) return

    const fetchGuestTypes = async () => {
      try {
        const response = await api.get(`/events/${eventId}/guest-types`)
        // Deduplicate guest types by ID to prevent duplicate key warnings
        const uniqueGuestTypes = Array.from(
          new Map(response.data.map((type: any) => [type.id, type])).values()
        )
        setGuestTypes(uniqueGuestTypes)
      } catch (err) {
        console.error('Failed to fetch guest types:', err)
      }
    }

    fetchGuestTypes()
  }, [eventId])

  // Fetch badge template
  useEffect(() => {
    if (!eventId) return

    const fetchBadgeTemplate = async () => {
      try {
        // First try to get the official template
        const response = await getOfficialBadgeTemplate(Number(eventId))
        setBadgeTemplate(response.data)
      } catch (err) {
        try {
          // If no official template, try to get any template
          const response = await getBadgeTemplates(Number(eventId))
          if (Array.isArray(response.data) && response.data.length > 0) {
            setBadgeTemplate(response.data[0])
          }
        } catch (err2) {
          console.error('Failed to fetch badge template:', err2)
        }
      }
    }

    fetchBadgeTemplate()
  }, [eventId])

  // Handle add attendee form input changes
  const handleAddAttendeeInput = (field: string, value: string) => {
    setAddAttendeeForm((prev) => ({ ...prev, [field]: value }))
  }

  // Handle add attendee submission
  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddAttendeeLoading(true)

    try {
      // If badge code is provided, assign badge first
      if (badgeCode.trim()) {
        try {
          const assignResponse = await api.post(`/events/${eventId}/pre-generated-badges/assign`, {
            badge_code: badgeCode.trim(),
            first_name: addAttendeeForm.first_name,
            last_name: addAttendeeForm.last_name,
            email: addAttendeeForm.email || undefined,
            phone: addAttendeeForm.phone || undefined,
            company: addAttendeeForm.company || undefined,
            job_title: addAttendeeForm.jobtitle || undefined,
          })
          
          // Refresh attendees list
          const attendeesResponse = await api.get(`/events/${eventId}/attendees`)
          // Handle paginated response
          const data = attendeesResponse.data?.data ? attendeesResponse.data.data : attendeesResponse.data
          const indexed = (Array.isArray(data) ? data : []).map((a: any) => {
            const name = a?.guest?.name ? String(a.guest.name) : ''
            const email = a?.guest?.email ? String(a.guest.email) : ''
            const company = a?.guest?.company ? String(a.guest.company) : ''
            const blob = `${name} ${email} ${company}`.toLowerCase()
            return { ...a, _search: blob }
          })
          setAttendees(indexed)
          
          showSuccess('Success', 'Attendee registered with pre-generated badge!')
        } catch (badgeErr: any) {
          // If badge assignment fails, try regular attendee creation
          console.warn('Badge assignment failed:', badgeErr)
          showWarning('Warning', badgeErr.response?.data?.error || 'Could not assign badge, creating attendee without badge')
          
          // Fall through to regular attendee creation
          const payload = {
            ...addAttendeeForm,
            name: `${addAttendeeForm.first_name} ${addAttendeeForm.last_name}`.trim(),
          }
          
          const response = await api.post(`/events/${eventId}/attendees`, payload)
          const newAttendee = response.data
          
          setAttendees((prevAttendees) => [...prevAttendees, newAttendee])
          
          showSuccess('Success', 'Attendee added successfully (without badge)!')
        }
      } else {
        // No badge code - create attendee normally
        const payload = {
          ...addAttendeeForm,
          name: `${addAttendeeForm.first_name} ${addAttendeeForm.last_name}`.trim(),
        }

        const response = await api.post(`/events/${eventId}/attendees`, payload)
        const newAttendee = response.data

        setAttendees((prevAttendees) => [...prevAttendees, newAttendee])

        showSuccess('Success', 'Attendee added successfully!')
      }

      setAddAttendeeDialogOpen(false)
      setBadgeCode('')
      setAddAttendeeForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        jobtitle: '',
        gender: '',
        country: '',
        guest_type_id: '',
        badge_code: '',
      })
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.error) {
        showError('Error', err.response.data.error)
      } else {
        showError('Error', err.response?.data?.error || 'Failed to add attendee')
      }
    } finally {
      setAddAttendeeLoading(false)
    }
  }

  // Handle attendee selection
  const handleAttendeeSelection = (attendeeId: number, checked: boolean) => {
    setSelectedAttendees((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(attendeeId)
      } else {
        newSet.delete(attendeeId)
      }
      return newSet
    })
  }

  // Handle select all attendees
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(new Set(attendees.map((a) => a.id)))
    } else {
      setSelectedAttendees(new Set())
    }
  }

  // Handle attendee removal
  const handleRemoveAttendee = (attendee: any) => {
    setAttendeeToRemove(attendee);
    setRemoveAttendeeDialogOpen(true);
  };

  const handleRemoveAttendeeConfirm = async () => {
    if (!attendeeToRemove || !eventId) return;
    
    setRemoveAttendeeLoading(true);
    try {
      await api.delete(`/events/${eventId}/attendees/${attendeeToRemove.id}`);
      
      // Remove from local state
      setAttendees(prev => prev.filter(a => a.id !== attendeeToRemove.id));
      
      showSuccess('Success', 'Attendee removed from event successfully!');
      
      setRemoveAttendeeDialogOpen(false);
      setAttendeeToRemove(null);
    } catch (err: any) {
      showError('Error', err.response?.data?.error || 'Failed to remove attendee');
    } finally {
      setRemoveAttendeeLoading(false);
    }
  };

  // Handle QR code scan for check-in
  const handleQRScan = async (uuid: string) => {
    if (!eventId || !uuid) {
      showError('Error', 'Event ID or QR code is missing');
      return;
    }

    setQrScanning(true);
    try {
      // Call the check-in API with the UUID from QR code
      const response = await checkInByQR(Number(eventId), uuid.trim());
      
      if (response.data) {
        const attendee = response.data.attendee;
        showSuccess('Check-in Successful', `${attendee?.guest?.name || 'Attendee'} has been checked in successfully!`);
        
        // Refresh attendees list to show updated check-in status
        await fetchAttendeesWithFilters();
        
        // Close scanner after successful check-in
        setQrScannerOpen(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to check in attendee. Please try again.';
      showError('Check-in Failed', errorMessage);
    } finally {
      setQrScanning(false);
    }
  };

  // Filter attendees - API handles search, guest_type, and checked_in filters server-side
  // Client-side filtering is no longer needed since API applies all filters
  // Just use attendees directly as they're already filtered by the API
  const filteredAttendees = attendees

  // Validate badge template
  const validateBadgeTemplate = (template: BadgeTemplate | null): boolean => {
    if (!template) {
      showError('Error', 'No badge template available. Please create a badge template first.')
      return false
    }

    if (!template.template_json) {
      showError('Error', 'Badge template is invalid. Please recreate the template.')
      return false
    }

    const templateData = template.template_json
    if (!templateData.front && !templateData.back) {
      showError('Error', 'Badge template is missing design elements. Please recreate the template.')
      return false
    }

    return true
  }

  // Generate single badge (matches attendees tab)
  const generateBadge = async (attendee: any) => {
    if (printTemplateChoice === 'assigned' && !validateBadgeTemplate(badgeTemplate)) return

    if (!attendee || !attendee.guest) {
      showError('Error', 'Invalid attendee data. Please try again.')
      return
    }

    setSinglePrintAttendee(attendee);
    // Optimized: Use utility function for faster badge generation
    setTimeout(async () => {
      if (singlePrintRef.current) {
        const badgeElement = await waitForElement('.printable-badge-batch', singlePrintRef.current);
        if (!badgeElement) {
          showError('Error', 'No badge found to print.');
          setSinglePrintAttendee(null);
          return;
        }
        
        try {
          const blob = await generateSingleBadgePDF(badgeElement);
          printPDFBlob(blob);
          setSinglePrintAttendee(null);
        } catch (error) {
          showError('Error', 'Failed to generate badge PDF.');
          setSinglePrintAttendee(null);
        }
      }
    }, 100); // Further reduced timeout for faster response
  }

  // Test badge
  const testBadge = (attendee: any) => {
    setTestAttendee(attendee)
    setShowTestBadge(true)
  }

  // Handle batch print badges
  const handleBatchPrintBadges = async () => {
    if (printTemplateChoice === 'assigned' && !validateBadgeTemplate(badgeTemplate)) return
    if (selectedAttendees.size === 0) {
      showError('Error', 'Please select at least one attendee to print badges for.')
      return
    }

    const selectedAttendeeList = attendees.filter((attendee) =>
      selectedAttendees.has(attendee.id)
    )
    const invalidAttendees = selectedAttendeeList.filter(
      (attendee) => !attendee.guest
    )

    if (invalidAttendees.length > 0) {
      showError('Error', `${invalidAttendees.length} attendees have invalid data. Please check and try again.`)
      return
    }

    setPrinting(true);
    // Optimized: Use utility function for faster batch badge generation
    setTimeout(async () => {
      if (printRef.current) {
        const badgeElements = Array.from(printRef.current.querySelectorAll('.printable-badge-batch')) as HTMLElement[];
        if (badgeElements.length === 0) {
          showError('Error', 'No badges found to print.');
          setPrinting(false);
          return;
        }
        
        try {
          const blob = await generateBatchBadgePDF(badgeElements);
          printPDFBlob(blob);
          setPrinting(false);
        } catch (error) {
          showError('Error', 'Failed to generate batch badge PDF.');
          setPrinting(false);
        }
      }
    }, 100); // Further reduced timeout for faster response
  }


  const exportAttendeesToCSV = () => {
    if (filteredAttendees.length === 0) {
      showInfo('Info', 'No attendees to export.')
      return
    }

    const dataToExport = filteredAttendees.map((attendee) => {
      // Handle guest type display properly for CSV export
      let guestTypeName = 'N/A';
      if (attendee.guest_type) {
        if (typeof attendee.guest_type === 'object' && attendee.guest_type !== null) {
          guestTypeName = attendee.guest_type.name || attendee.guest_type.id || 'N/A';
        } else if (typeof attendee.guest_type === 'string') {
          guestTypeName = attendee.guest_type;
        } else {
          guestTypeName = String(attendee.guest_type);
        }
      }
      
      return {
        'Attendee ID': attendee.id,
        'Name': attendee.guest?.name || 'N/A',
        'Email': attendee.guest?.email || 'N/A',
        'Phone': attendee.guest?.phone || 'N/A',
        'Company': attendee.guest?.company || 'N/A',
        'Job Title': attendee.guest?.jobtitle || 'N/A',
        'Gender': attendee.guest?.gender || 'N/A',
        'Country': attendee.guest?.country || 'N/A',
        'Guest Type': guestTypeName,
        'Registration Date': attendee.created_at 
          ? new Date(attendee.created_at).toLocaleString()
          : 'N/A',
        'Checked In': attendee.checked_in ? 'Yes' : 'No',
        'Check-In Time': attendee.check_in_time
          ? new Date(attendee.check_in_time).toLocaleString()
          : 'N/A',
      };
    })

    const csv = Papa.unparse(dataToExport)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${eventData.name}_attendees.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showSuccess('Success', 'Attendee data exported successfully.')
  }

  if (eventLoading)
    return <div className="p-8 text-center">Loading event...</div>
  if (eventError)
    return <div className="p-8 text-center text-red-500">{eventError}</div>
  if (!eventData) return <div className="p-8 text-center">Event not found.</div>

  return (
    <UsherMobileLayout title={eventData.name}>
      <div className="space-y-6 px-4 pb-12">
        {/* Mobile Header with QR Quick Action */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Guest Management</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white">{attendees.length}</span>
                <span className="text-gray-500 font-medium text-sm">Total Guests</span>
              </div>
            </div>
            <Button 
              onClick={() => setQrScannerOpen(true)}
              className="w-16 h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 flex items-center justify-center p-0"
            >
              <QrCode className="w-8 h-8" />
            </Button>
          </div>

          {/* Mobile Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="search"
              placeholder="Search guest name or company..."
              className="w-full h-14 pl-12 pr-4 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary/20 transition-all text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Chips - Horizontal Scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 no-scrollbar">
          <Badge 
            onClick={() => setCheckedInFilter('all')}
            className={cn(
              "rounded-full px-5 py-2.5 text-[10px] font-black uppercase cursor-pointer border-none transition-all flex-shrink-0 whitespace-nowrap",
              checkedInFilter === 'all' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-gray-400"
            )}
          >
            All Guests
          </Badge>
          <Badge 
            onClick={() => setCheckedInFilter('checked-in')}
            className={cn(
              "rounded-full px-5 py-2.5 text-[10px] font-black uppercase cursor-pointer border-none transition-all flex-shrink-0 whitespace-nowrap",
              checkedInFilter === 'checked-in' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-white/5 text-gray-400"
            )}
          >
            Checked In
          </Badge>
          <Badge 
            onClick={() => setCheckedInFilter('not-checked-in')}
            className={cn(
              "rounded-full px-5 py-2.5 text-[10px] font-black uppercase cursor-pointer border-none transition-all flex-shrink-0 whitespace-nowrap",
              checkedInFilter === 'not-checked-in' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/5 text-gray-400"
            )}
          >
            Pending
          </Badge>
        </div>

        {/* Mobile Guest Cards */}
        <div className="space-y-4">
          {attendeesLoading ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Syncing Guest Data...</p>
            </div>
          ) : (
            filteredAttendees.map((attendee) => (
              <div key={attendee.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md relative group overflow-hidden transition-all hover:bg-white/10 active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xl font-black text-white border border-white/5 shadow-inner">
                      {attendee.guest?.name?.charAt(0) || 'G'}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg text-white leading-none pt-1">{attendee.guest?.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {attendee.guest?.company || 'Individual Guest'}
                      </p>
                      <div className="pt-2">
                        <Badge className={cn("text-[9px] font-black uppercase rounded-lg px-3 py-1 border-none", getGuestTypeBadgeClasses(attendee.guest_type?.name))}>
                          {attendee.guest_type?.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {attendee.checked_in ? (
                      <div className="bg-green-500/10 text-green-400 p-3 rounded-[1.2rem] border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleQRScan(attendee.guest?.uuid)}
                        className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase rounded-[1.2rem] h-12 px-6 shadow-lg shadow-primary/20"
                      >
                        Check-in
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Secondary Actions for mobile (Touch friendly) */}
                <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPendingSingleAttendee(attendee)
                      setPrintTemplateDialogOpen(true)
                    }}
                    className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] uppercase h-11 rounded-xl transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 mr-2 text-primary" /> Print Badge
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/dashboard/messages?eventId=${eventId}`)}
                    className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] uppercase h-11 rounded-xl transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-2 text-primary" /> Message
                  </Button>
                </div>
              </div>
            ))
          )}
          
          {filteredAttendees.length === 0 && !attendeesLoading && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-700" />
              </div>
              <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No guests matching filters</p>
            </div>
          )}
        </div>

        {/* Floating Action Button for adding walk-ins */}
        <div className="fixed bottom-28 right-6 z-50">
          <Button 
            onClick={() => setAddAttendeeDialogOpen(true)}
            className="w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-primary to-blue-500 text-white shadow-[0_15px_30px_rgba(var(--primary-rgb),0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center p-0 border-4 border-[#0b1630]"
          >
            <Plus className="w-10 h-10" />
          </Button>
        </div>
      </div>

      {/* Hidden single badge print area */}
      <div
        ref={singlePrintRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          visibility: 'hidden',
          zIndex: -1,
          width: '100%',
          height: '100%',
        }}
        className="printable-badge-container"
      >
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #single-print-area, #single-print-area * { visibility: visible !important; }
            #single-print-area { 
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
        <div id="single-print-area">
        {singlePrintAttendee && (
          <div className="printable-badge-batch">
            <BadgePrint
              attendee={singlePrintAttendee}
              template={printTemplateChoice === 'assigned' ? badgeTemplate : null}
            />
          </div>
        )}
        </div>
      </div>

      {/* Hidden batch badge print area */}
      <div
        ref={printRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          visibility: 'hidden',
          zIndex: -1,
          width: '100%',
          height: '100%',
        }}
        className="printable-badge-container"
      >
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #batch-print-area, #batch-print-area * { visibility: visible !important; }
            #batch-print-area { 
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
        <div id="batch-print-area">
        {printing &&
          attendees
            .filter((attendee) => selectedAttendees.has(attendee.id))
            .map((attendee) => (
              <div key={attendee.id} className="printable-badge-batch">
                <BadgePrint attendee={attendee} template={printTemplateChoice === 'assigned' ? badgeTemplate : null} />
              </div>
            ))}
        </div>
      </div>

      {/* Mobile Optimized Dialogs */}
      <Dialog open={addAttendeeDialogOpen} onOpenChange={setAddAttendeeDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg bg-[#0b1630] border-white/10 rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Register Guest</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">Add a walk-in attendee to this event</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAttendee} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">First Name</Label>
                <Input className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:border-primary transition-all" value={addAttendeeForm.first_name} onChange={e => handleAddAttendeeInput('first_name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Last Name</Label>
                <Input className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:border-primary transition-all" value={addAttendeeForm.last_name} onChange={e => handleAddAttendeeInput('last_name', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Email Address</Label>
              <Input className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:border-primary transition-all" type="email" value={addAttendeeForm.email} onChange={e => handleAddAttendeeInput('email', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Guest Classification</Label>
              <Select onValueChange={v => handleAddAttendeeInput('guest_type_id', v)} value={addAttendeeForm.guest_type_id}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0b1630] border-white/10 rounded-2xl">
                  {guestTypes.map(gt => (
                    <SelectItem key={gt.id} value={String(gt.id)} className="text-white hover:bg-white/10 focus:bg-white/10 py-3">{gt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={addAttendeeLoading} className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest mt-6 shadow-xl shadow-primary/20">
              {addAttendeeLoading ? 'Processing...' : 'Complete Registration'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog - Full Screen Vibe */}
      <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
        <DialogContent className="w-[100vw] h-[100vh] sm:w-[95vw] sm:h-[90vh] max-w-md bg-black border-none rounded-none sm:rounded-[3rem] p-0 overflow-hidden">
          <div className="relative h-full flex flex-col">
            <Button 
              variant="ghost" 
              onClick={() => setQrScannerOpen(false)}
              className="absolute top-6 right-6 z-50 text-white/50 hover:text-white bg-white/5 rounded-full p-2 h-12 w-12"
            >
              <X className="w-8 h-8" />
            </Button>
            
            <div className="flex-1 relative flex flex-col items-center justify-center">
              <div className="absolute top-16 text-center space-y-2 z-10 px-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Point & Scan</h2>
                <p className="text-xs text-white/60 font-bold uppercase tracking-[0.2em]">Center QR code in frame</p>
              </div>
              
              <div className="w-full h-full">
                <QRScanner onScan={handleQRScan} isEnabled={!qrScanning} />
              </div>

              {qrScanning && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-primary font-black uppercase tracking-widest text-xs animate-pulse">Checking In...</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Required Print Logic Components */}
      <PrintBadgeTemplateDialog
        open={printTemplateDialogOpen}
        onOpenChange={setPrintTemplateDialogOpen}
        attendeeForPreview={pendingSingleAttendee}
        assignedTemplate={badgeTemplate}
        onChoose={(choice) => {
          setPrintTemplateChoice(choice)
          setTimeout(() => generateBadge(pendingSingleAttendee), 100)
        }}
      />
      
      {/* Remove Attendee Confirmation Dialog */}
      <Dialog open={removeAttendeeDialogOpen} onOpenChange={setRemoveAttendeeDialogOpen}>
        <DialogContent className="bg-[#0b1630] border-white/10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Removal</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to remove {attendeeToRemove?.guest?.name || 'this attendee'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button variant="outline" onClick={() => setRemoveAttendeeDialogOpen(false)} disabled={removeAttendeeLoading} className="border-white/10 text-white bg-white/5 rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveAttendeeConfirm} disabled={removeAttendeeLoading} className="bg-red-500 hover:bg-red-600 rounded-xl font-bold">Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BadgeAssignmentDialog
        open={assignBadgeDialogOpen}
        onOpenChange={setAssignBadgeDialogOpen}
        eventId={Number(eventId)}
        onSuccess={() => fetchAttendeesWithFilters()}
      />
    </UsherMobileLayout>
  )
}
