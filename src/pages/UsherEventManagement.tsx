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
} from 'lucide-react'
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
import BadgePrint from '@/components/Badge'
import BadgeTest from '@/components/BadgeTest'
import {
  getOfficialBadgeTemplate,
  getBadgeTemplates,
} from '@/lib/badgeTemplates'
import { BadgeTemplate } from '@/types/badge'
import React, { Suspense } from 'react'
import Papa from 'papaparse';
import { postAttendeesBatch } from '@/lib/api';
import { generateSingleBadgePDF, generateBatchBadgePDF, printPDFBlob, waitForElement } from '@/lib/badgeUtils';
import { BadgeAssignmentDialog } from '@/components/BadgeAssignmentDialog';
import { QRScanner } from '@/components/checkin/QRScanner';
import { checkInByQR } from '@/lib/api';


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
    content: () => singlePrintRef.current,
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
    removeAfterPrint: true,
    suppressErrors: false,
  })

  const handlePrintBadges = useReactToPrint({
    content: () => printRef.current,
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
    removeAfterPrint: true,
    suppressErrors: false,
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
    if (!validateBadgeTemplate(badgeTemplate)) {
      return
    }

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
    if (!validateBadgeTemplate(badgeTemplate)) {
      return
    }
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
    <div className="space-y-6 px-3 md:px-6 max-w-[1400px] mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Events', href: '/dashboard/events' },
          { label: eventData?.name || 'Event Management' }
        ]}
        className="mb-4"
      />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{eventData.name}</h1>
          <p className="text-gray-600 mt-1">Event Management for Ushers</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Event Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Date</Label>
              <p className="text-sm">
                {new Date(eventData.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Location
              </Label>
              <p className="text-sm">{eventData.location}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Total Attendees
              </Label>
              <p className="text-sm">{attendees.length}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Status
              </Label>
              <Badge
                variant={
                  eventData.status === 'active' ? 'default' : 'secondary'
                }
              >
                {eventData.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="attendees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="badges">Badge Printing</TabsTrigger>
          <TabsTrigger value="onsite-checkin">
            Onsite Check-In & Walk-In Handling
          </TabsTrigger>
        </TabsList>

        {/* Attendees Tab */}
        <TabsContent value="attendees" className="space-y-4">
          {/* Upload CSV button for attendees tab */}
          <div className="flex flex-col items-start mb-2">
            <Button
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="mb-1"
            >
              Upload Attendees CSV
            </Button>
            <span className="text-xs text-gray-500">Upload a CSV file to add multiple attendees at once.</span>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Attendees ({attendees.length})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setQrScannerOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportAttendeesToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBatchPrintBadges}
                    disabled={selectedAttendees.size === 0 || !badgeTemplate}
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Selected Badges
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, company..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={guestTypeFilter}
                  onValueChange={setGuestTypeFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Guest Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {guestTypes.map((type, idx) => (
                      <SelectItem key={`${type.id}-${idx}`} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={checkedInFilter}
                  onValueChange={setCheckedInFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Check-in Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="not-checked-in">
                      Not Checked In
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attendees Table */}
              <div className="rounded-md border min-w-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedAttendees.size === attendees.length &&
                            attendees.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Guest Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendeesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading attendees...
                        </TableCell>
                      </TableRow>
                    ) : attendeesError ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-red-500"
                        >
                          {attendeesError}
                        </TableCell>
                      </TableRow>
                    ) : filteredAttendees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No attendees found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No matching guests found for "{searchTerm}".
                          </TableCell>
                        </TableRow>
                      ) : filteredAttendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAttendees.has(attendee.id)}
                              onCheckedChange={(checked) =>
                                handleAttendeeSelection(
                                  attendee.id,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {attendee.guest?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {attendee.guest?.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {attendee.guest?.company || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getGuestTypeBadgeClasses(attendee.guest_type?.name)}>
                              {attendee.guest_type?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCheckInBadgeClasses(attendee.checked_in)}>
                              {attendee.checked_in ? 'Checked In' : 'Registered'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generateBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Print Badge"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => testBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Preview badge"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(user?.role === 'admin' || user?.role === 'superadmin' || 
                                (['organizer', 'organizer_admin'].includes(user?.role) && eventData?.organizer_id === user?.organizer_id)) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveAttendee(attendee)}
                                  title="Remove Attendee"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setAssignBadgeDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Assign Pre-Generated Badge
            </Button>
          </div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Upload Attendees (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFile}
                  className="hidden"
                  disabled={csvLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  disabled={csvLoading}
                >
                  Upload CSV
                </Button>
                <Button variant="outline" onClick={handleDownloadSampleCSV} type="button">
                  Download Sample CSV
                </Button>
                {csvFileName && <span className="text-sm text-gray-600">{csvFileName}</span>}
              </div>
              {csvErrors.length > 0 && (
                <div className="mb-2 text-red-600 text-sm">
                  {csvErrors.map((err, i) => (
                    <div key={i}>Row {err.row}: {err.error}</div>
                  ))}
                </div>
              )}
              {csvRows.length > 0 && (
                <div className="overflow-x-auto mb-2 space-y-2">
                  <div className="text-sm text-gray-700">
                    Previewing first {csvPreviewRows.length} of {csvRows.length} rows.
                  </div>
                  <table className="min-w-full text-xs border">
                    <thead>
                      <tr>
                        {requiredHeaders.map((h) => (
                          <th key={h} className="border px-2 py-1">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreviewRows.map((row, idx) => (
                        <tr key={idx} className={csvErrors.some((err) => err.row === idx + 2) ? 'bg-red-50' : ''}>
                          {requiredHeaders.map((h) => (
                            <td key={h} className="border px-2 py-1">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {csvRows.length > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    onClick={handleUploadCSV}
                    disabled={csvLoading || csvErrors.length > 0}
                  >
                    {csvLoading ? 'Uploading...' : 'Confirm Upload'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCsvRows([]); setCsvErrors([]); setCsvFileName(null); setCsvPreviewRows([]); setCsvSuccess(null); setCsvFailure(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
              {csvSuccess && <div className="text-green-600 mt-2 text-sm">{csvSuccess}</div>}
              {csvFailure && <div className="text-red-600 mt-2 text-sm">{csvFailure}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register New Attendee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setAddAttendeeDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Attendee
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badge Printing Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Badge Printing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={badgeTemplate ? 'default' : 'secondary'}>
                    {badgeTemplate ? 'Template Available' : 'No Template'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {badgeTemplate
                      ? badgeTemplate.name
                      : 'No badge template found for this event'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Single Badge</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Print individual badges for specific attendees
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!badgeTemplate}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Single Badge
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Batch Printing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Print multiple badges for selected attendees
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleBatchPrintBadges}
                        disabled={
                          selectedAttendees.size === 0 || !badgeTemplate
                        }
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Selected ({selectedAttendees.size})
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onsite Check-In Tab */}
        <TabsContent value="onsite-checkin">
          <DashboardCard title="Onsite Check-In & Walk-In Handling">
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Manual Check-In</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Use the search functionality above to find and check in attendees manually.
              </p>
            </div>

            {/* Manual Check-In */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Manual Check-In</h4>
              <Input
                type="search"
                placeholder="Search by name, email, or company..."
                className="mb-3 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-72 overflow-y-auto border rounded bg-gray-50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees
                      .filter((a) => !debouncedSearchTerm || a._search?.includes(debouncedSearchTerm))
                      .map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.guest?.name}</TableCell>
                          <TableCell>{a.guest?.email}</TableCell>
                          <TableCell>{a.guest?.company}</TableCell>
                          <TableCell>
                            {a.checked_in ? (
                              <Badge className="bg-green-100 text-green-700">
                                Present
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700">
                                Absent
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.checked_in ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await api.post(
                                    `/events/${eventId}/attendees/${a.id}/check-in`,
                                    { checked_in: false }
                                  )
                                  setAttendees((prev) =>
                                    prev.map((att) =>
                                      att.id === a.id
                                        ? { ...att, checked_in: false }
                                        : att
                                    )
                                  )
                                }}
                              >
                                Mark Absent
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await api.post(
                                    `/events/${eventId}/attendees/${a.id}/check-in`,
                                    { checked_in: true }
                                  )
                                  setAttendees((prev) =>
                                    prev.map((att) =>
                                      att.id === a.id
                                        ? { ...att, checked_in: true }
                                        : att
                                    )
                                  )
                                }}
                              >
                                Mark Present
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Walk-In Registration */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Walk-In Registration</h4>
              
              {/* Existing Guest Info Banner */}
              {existingGuestInfo && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">ℹ</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Existing guest found!</strong> We found a guest with this email/phone number. 
                        We'll update their information with the latest details you provide.
                      </p>
                      <div className="mt-2 text-xs text-blue-700">
                        <p><strong>Previous info:</strong> {existingGuestInfo.name} • {existingGuestInfo.company} • {existingGuestInfo.jobtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded border"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setAddAttendeeLoading(true)
                  try {
                    const payload = {
                      ...addAttendeeForm,
                      name: `${addAttendeeForm.first_name} ${addAttendeeForm.last_name}`.trim(),
                    }
                    const response = await api.post(
                      `/events/${eventId}/attendees`,
                      payload
                    )
                    const newAttendee = response.data
                    setAttendees((prev) => [...prev, newAttendee])
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
                    })
                    setAddAttendeeDialogOpen(false)
                    setSinglePrintAttendee(newAttendee)
                    setTimeout(() => {
                      if (singlePrintRef.current) {
                        singlePrintRef.current.style.visibility = 'visible'
                        handleSinglePrint()
                      }
                    }, 500)
                    toast({
                      title: 'Walk-in registered!',
                      description:
                        'Badge is printing and attendee list updated.',
                      variant: 'success',
                    })
                  } catch (err: any) {
                    toast({
                      title: 'Failed to register walk-in',
                      description:
                        err.response?.data?.error || 'Please try again.',
                      variant: 'destructive',
                    })
                  } finally {
                    setAddAttendeeLoading(false)
                  }
                }}
              >
                <Input
                  placeholder="First Name"
                  value={addAttendeeForm.first_name}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      first_name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Last Name"
                  value={addAttendeeForm.last_name}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      last_name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={addAttendeeForm.email}
                  onChange={(e) => {
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      email: e.target.value,
                    }));
                    
                    // Check for existing guest when email changes
                    const email = e.target.value;
                    const phone = addAttendeeForm.phone;
                    
                    // Debounce the validation
                    const timeoutId = setTimeout(() => {
                      if (email || phone) {
                        checkExistingGuest(email, phone);
                      }
                    }, 500);
                    
                    return () => clearTimeout(timeoutId);
                  }}
                  required
                  className={`${
                    validationStatus.email === 'valid' ? 'border-green-500 focus:border-green-500 focus:ring-green-200' : ''
                  } ${
                    validationStatus.email === 'checking' ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-200' : ''
                  } ${
                    validationStatus.email === 'duplicate' ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-200' : ''
                  }`}
                />
                {validationStatus.email === 'checking' && (
                  <div className="col-span-2 flex items-center gap-2 text-blue-600 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking availability...</span>
                  </div>
                )}
                <Input
                  placeholder="Phone"
                  value={addAttendeeForm.phone}
                  onChange={(e) => {
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      phone: e.target.value,
                    }));
                    
                    // Check for existing guest when phone changes
                    const email = addAttendeeForm.email;
                    const phone = e.target.value;
                    
                    // Debounce the validation
                    const timeoutId = setTimeout(() => {
                      if (email || phone) {
                        checkExistingGuest(email, phone);
                      }
                    }, 500);
                    
                    return () => clearTimeout(timeoutId);
                  }}
                  className={`${
                    validationStatus.phone === 'valid' ? 'border-green-500 focus:border-green-500 focus:ring-green-200' : ''
                  } ${
                    validationStatus.phone === 'checking' ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-200' : ''
                  } ${
                    validationStatus.phone === 'duplicate' ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-200' : ''
                  }`}
                />
                <Input
                  placeholder="Company"
                  value={addAttendeeForm.company}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      company: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Job Title"
                  value={addAttendeeForm.jobtitle}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      jobtitle: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Gender"
                  value={addAttendeeForm.gender}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      gender: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Country"
                  value={addAttendeeForm.country}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      country: e.target.value,
                    }))
                  }
                />
                <Select
                  value={addAttendeeForm.guest_type_id}
                  onValueChange={(value) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      guest_type_id: value,
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Guest Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestTypes.map((type: any, idx: number) => (
                      <SelectItem key={`${type.id}-${idx}`} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  className="col-span-1 md:col-span-2 mt-2"
                  disabled={addAttendeeLoading}
                >
                  {addAttendeeLoading
                    ? 'Registering...'
                    : 'Register & Print Badge'}
                </Button>
              </form>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>

      {/* Add Attendee Dialog */}
      <Dialog
        open={addAttendeeDialogOpen}
        onOpenChange={setAddAttendeeDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Attendee</DialogTitle>
            <DialogDescription>
              Enter the details of the new attendee for {eventData.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAttendee} className="space-y-4 py-4">
            {/* Badge Code Input */}
            <div>
              <Label htmlFor="badge_code" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Badge QR Code (Optional)
              </Label>
              <Input
                id="badge_code"
                value={badgeCode}
                onChange={(e) => setBadgeCode(e.target.value)}
                placeholder="Scan or enter badge code to assign pre-generated badge"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to register without a pre-generated badge
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={addAttendeeForm.first_name}
                  onChange={(e) =>
                    handleAddAttendeeInput('first_name', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={addAttendeeForm.last_name}
                  onChange={(e) =>
                    handleAddAttendeeInput('last_name', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={addAttendeeForm.email}
                  onChange={(e) =>
                    handleAddAttendeeInput('email', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={addAttendeeForm.phone}
                  onChange={(e) =>
                    handleAddAttendeeInput('phone', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={addAttendeeForm.company}
                  onChange={(e) =>
                    handleAddAttendeeInput('company', e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="jobtitle">Job Title</Label>
                <Input
                  id="jobtitle"
                  value={addAttendeeForm.jobtitle}
                  onChange={(e) =>
                    handleAddAttendeeInput('jobtitle', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  onValueChange={(value) =>
                    handleAddAttendeeInput('gender', value)
                  }
                  value={addAttendeeForm.gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  onValueChange={(value) =>
                    handleAddAttendeeInput('country', value)
                  }
                  value={addAttendeeForm.country}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                    <SelectItem value="Albania">Albania</SelectItem>
                    <SelectItem value="Algeria">Algeria</SelectItem>
                    <SelectItem value="Andorra">Andorra</SelectItem>
                    <SelectItem value="Angola">Angola</SelectItem>
                    <SelectItem value="Antigua and Barbuda">
                      Antigua and Barbuda
                    </SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Armenia">Armenia</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                    <SelectItem value="Bahamas">Bahamas</SelectItem>
                    <SelectItem value="Bahrain">Bahrain</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="Barbados">Barbados</SelectItem>
                    <SelectItem value="Belarus">Belarus</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Belize">Belize</SelectItem>
                    <SelectItem value="Benin">Benin</SelectItem>
                    <SelectItem value="Bhutan">Bhutan</SelectItem>
                    <SelectItem value="Bolivia">Bolivia</SelectItem>
                    <SelectItem value="Bosnia and Herzegovina">
                      Bosnia and Herzegovina
                    </SelectItem>
                    <SelectItem value="Botswana">Botswana</SelectItem>
                    <SelectItem value="Brazil">Brazil</SelectItem>
                    <SelectItem value="Brunei">Brunei</SelectItem>
                    <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                    <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                    <SelectItem value="Burundi">Burundi</SelectItem>
                    <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                    <SelectItem value="Cambodia">Cambodia</SelectItem>
                    <SelectItem value="Cameroon">Cameroon</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Central African Republic">
                      Central African Republic
                    </SelectItem>
                    <SelectItem value="Chad">Chad</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Comoros">Comoros</SelectItem>
                    <SelectItem value="Congo">Congo</SelectItem>
                    <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                    <SelectItem value="Croatia">Croatia</SelectItem>
                    <SelectItem value="Cuba">Cuba</SelectItem>
                    <SelectItem value="Cyprus">Cyprus</SelectItem>
                    <SelectItem value="Czech Republic">
                      Czech Republic
                    </SelectItem>
                    <SelectItem value="Democratic Republic of the Congo">
                      Democratic Republic of the Congo
                    </SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Djibouti">Djibouti</SelectItem>
                    <SelectItem value="Dominica">Dominica</SelectItem>
                    <SelectItem value="Dominican Republic">
                      Dominican Republic
                    </SelectItem>
                    <SelectItem value="Ecuador">Ecuador</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                    <SelectItem value="El Salvador">El Salvador</SelectItem>
                    <SelectItem value="Equatorial Guinea">
                      Equatorial Guinea
                    </SelectItem>
                    <SelectItem value="Eritrea">Eritrea</SelectItem>
                    <SelectItem value="Estonia">Estonia</SelectItem>
                    <SelectItem value="Eswatini">Eswatini</SelectItem>
                    <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                    <SelectItem value="Fiji">Fiji</SelectItem>
                    <SelectItem value="Finland">Finland</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Gabon">Gabon</SelectItem>
                    <SelectItem value="Gambia">Gambia</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Greece">Greece</SelectItem>
                    <SelectItem value="Grenada">Grenada</SelectItem>
                    <SelectItem value="Guatemala">Guatemala</SelectItem>
                    <SelectItem value="Guinea">Guinea</SelectItem>
                    <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                    <SelectItem value="Guyana">Guyana</SelectItem>
                    <SelectItem value="Haiti">Haiti</SelectItem>
                    <SelectItem value="Honduras">Honduras</SelectItem>
                    <SelectItem value="Hungary">Hungary</SelectItem>
                    <SelectItem value="Iceland">Iceland</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Indonesia">Indonesia</SelectItem>
                    <SelectItem value="Iran">Iran</SelectItem>
                    <SelectItem value="Iraq">Iraq</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    <SelectItem value="Israel">Israel</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Jamaica">Jamaica</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Jordan">Jordan</SelectItem>
                    <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Kiribati">Kiribati</SelectItem>
                    <SelectItem value="Kuwait">Kuwait</SelectItem>
                    <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                    <SelectItem value="Laos">Laos</SelectItem>
                    <SelectItem value="Latvia">Latvia</SelectItem>
                    <SelectItem value="Lebanon">Lebanon</SelectItem>
                    <SelectItem value="Lesotho">Lesotho</SelectItem>
                    <SelectItem value="Liberia">Liberia</SelectItem>
                    <SelectItem value="Libya">Libya</SelectItem>
                    <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                    <SelectItem value="Lithuania">Lithuania</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="Madagascar">Madagascar</SelectItem>
                    <SelectItem value="Malawi">Malawi</SelectItem>
                    <SelectItem value="Malaysia">Malaysia</SelectItem>
                    <SelectItem value="Maldives">Maldives</SelectItem>
                    <SelectItem value="Mali">Mali</SelectItem>
                    <SelectItem value="Malta">Malta</SelectItem>
                    <SelectItem value="Marshall Islands">
                      Marshall Islands
                    </SelectItem>
                    <SelectItem value="Mauritania">Mauritania</SelectItem>
                    <SelectItem value="Mauritius">Mauritius</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                    <SelectItem value="Micronesia">Micronesia</SelectItem>
                    <SelectItem value="Moldova">Moldova</SelectItem>
                    <SelectItem value="Monaco">Monaco</SelectItem>
                    <SelectItem value="Mongolia">Mongolia</SelectItem>
                    <SelectItem value="Montenegro">Montenegro</SelectItem>
                    <SelectItem value="Morocco">Morocco</SelectItem>
                    <SelectItem value="Mozambique">Mozambique</SelectItem>
                    <SelectItem value="Myanmar">Myanmar</SelectItem>
                    <SelectItem value="Namibia">Namibia</SelectItem>
                    <SelectItem value="Nauru">Nauru</SelectItem>
                    <SelectItem value="Nepal">Nepal</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="New Zealand">New Zealand</SelectItem>
                    <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                    <SelectItem value="Niger">Niger</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="North Korea">North Korea</SelectItem>
                    <SelectItem value="North Macedonia">
                      North Macedonia
                    </SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Oman">Oman</SelectItem>
                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                    <SelectItem value="Palau">Palau</SelectItem>
                    <SelectItem value="Panama">Panama</SelectItem>
                    <SelectItem value="Papua New Guinea">
                      Papua New Guinea
                    </SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Peru">Peru</SelectItem>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="Poland">Poland</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="Romania">Romania</SelectItem>
                    <SelectItem value="Russia">Russia</SelectItem>
                    <SelectItem value="Rwanda">Rwanda</SelectItem>
                    <SelectItem value="Saint Kitts and Nevis">
                      Saint Kitts and Nevis
                    </SelectItem>
                    <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                    <SelectItem value="Saint Vincent and the Grenadines">
                      Saint Vincent and the Grenadines
                    </SelectItem>
                    <SelectItem value="Samoa">Samoa</SelectItem>
                    <SelectItem value="San Marino">San Marino</SelectItem>
                    <SelectItem value="Sao Tome and Principe">
                      Sao Tome and Principe
                    </SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Senegal">Senegal</SelectItem>
                    <SelectItem value="Serbia">Serbia</SelectItem>
                    <SelectItem value="Seychelles">Seychelles</SelectItem>
                    <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Slovakia">Slovakia</SelectItem>
                    <SelectItem value="Slovenia">Slovenia</SelectItem>
                    <SelectItem value="Solomon Islands">
                      Solomon Islands
                    </SelectItem>
                    <SelectItem value="Somalia">Somalia</SelectItem>
                    <SelectItem value="South Africa">South Africa</SelectItem>
                    <SelectItem value="South Korea">South Korea</SelectItem>
                    <SelectItem value="South Sudan">South Sudan</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                    <SelectItem value="Sudan">Sudan</SelectItem>
                    <SelectItem value="Suriname">Suriname</SelectItem>
                    <SelectItem value="Sweden">Sweden</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="Syria">Syria</SelectItem>
                    <SelectItem value="Taiwan">Taiwan</SelectItem>
                    <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                    <SelectItem value="Tanzania">Tanzania</SelectItem>
                    <SelectItem value="Thailand">Thailand</SelectItem>
                    <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                    <SelectItem value="Togo">Togo</SelectItem>
                    <SelectItem value="Tonga">Tonga</SelectItem>
                    <SelectItem value="Trinidad and Tobago">
                      Trinidad and Tobago
                    </SelectItem>
                    <SelectItem value="Tunisia">Tunisia</SelectItem>
                    <SelectItem value="Turkey">Turkey</SelectItem>
                    <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                    <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                    <SelectItem value="Uganda">Uganda</SelectItem>
                    <SelectItem value="Ukraine">Ukraine</SelectItem>
                    <SelectItem value="United Arab Emirates">
                      United Arab Emirates
                    </SelectItem>
                    <SelectItem value="United Kingdom">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                    <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                    <SelectItem value="Vatican City">Vatican City</SelectItem>
                    <SelectItem value="Venezuela">Venezuela</SelectItem>
                    <SelectItem value="Vietnam">Vietnam</SelectItem>
                    <SelectItem value="Yemen">Yemen</SelectItem>
                    <SelectItem value="Zambia">Zambia</SelectItem>
                    <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="guest_type_id">Guest Type</Label>
              <Select
                onValueChange={(value) =>
                  handleAddAttendeeInput('guest_type_id', value)
                }
                value={addAttendeeForm.guest_type_id}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a guest type" />
                </SelectTrigger>
                <SelectContent>
                  {guestTypes
                    .filter(
                      (type) =>
                        type.id !== undefined &&
                        type.id !== null &&
                        type.id !== ''
                    )
                    .map((type, idx) => (
                      <SelectItem key={`${type.id}-${idx}`} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddAttendeeDialogOpen(false)}
                disabled={addAttendeeLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addAttendeeLoading}>
                {addAttendeeLoading ? 'Adding...' : 'Add Attendee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <BadgePrint attendee={attendee} />
              </div>
            ))}
        </div>
      </div>

      {/* Test badge display */}
      {showTestBadge && testAttendee && (
        <Dialog open={showTestBadge} onOpenChange={setShowTestBadge}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Badge Preview</DialogTitle>
              <DialogDescription>
                This is a preview of how the badge will look when printed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <BadgeTest attendee={testAttendee} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestBadge(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowTestBadge(false)
                  generateBadge(testAttendee)
                }}
              >
                Print Badge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove Attendee Confirmation Dialog */}
      <Dialog open={removeAttendeeDialogOpen} onOpenChange={setRemoveAttendeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Attendee</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {attendeeToRemove?.guest?.name || 'this attendee'} from the event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveAttendeeDialogOpen(false)}
              disabled={removeAttendeeLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAttendeeConfirm}
              disabled={removeAttendeeLoading}
            >
              {removeAttendeeLoading ? 'Removing...' : 'Remove Attendee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Assignment Dialog */}
      {/* QR Scanner Dialog */}
      <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code for Check-in</DialogTitle>
            <DialogDescription>
              Scan the attendee's QR code to check them in for this event. The QR code contains the guest UUID which will be used to identify and check in the attendee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <QRScanner
              onScan={handleQRScan}
              isEnabled={!qrScanning}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQrScannerOpen(false)}
              disabled={qrScanning}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BadgeAssignmentDialog
        open={assignBadgeDialogOpen}
        onOpenChange={setAssignBadgeDialogOpen}
        eventId={Number(eventId)}
        onSuccess={() => {
          // Refresh attendees list after assignment
          fetchAttendees()
        }}
      />
    </div>
  )
}
