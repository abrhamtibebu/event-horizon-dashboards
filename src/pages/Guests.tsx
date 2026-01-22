import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { DashboardCard } from '@/components/DashboardCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Search, Users as UsersIcon, Mail, MessageSquare, Filter, Download, FileText, FileSpreadsheet, MoreVertical, Star, RefreshCw } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAllGuests, getMyEvents } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { ProtectedButton } from '@/components/ProtectedButton';
import api from '@/lib/api';
import Papa from 'papaparse';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useModernAlerts } from '@/hooks/useModernAlerts';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  gender?: string;
  country?: string;
  guest_type?: { name: string };
  checked_in?: boolean;
  [key: string]: any;
}

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // Modern alerts system
  const { showSuccess, showError, showInfo } = useModernAlerts();
  const { user } = useAuth();
  const { checkPermission } = usePermissionCheck();

  // Check if user is organizer (guests list is only for organizers)
  const isAdminOrOrganizer = user?.role === 'organizer' || user?.role === 'organizer_admin';

  // Pagination hook - only for admin and organizer
  const {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination
  } = usePagination({ defaultPerPage: 15, searchParamPrefix: 'guests' });

  // Add a mapping from guest ID to event names
  const [guestEvents, setGuestEvents] = useState<Record<string, string[]>>({});

  // Filter states
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [guestTypeFilter, setGuestTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchGuestsForOrganizer = async () => {
      try {
        setLoading(true);
        setError(null);
        const eventsRes = await getMyEvents('active,upcoming,completed');
        // Handle paginated response structure
        const events = eventsRes.data.data || eventsRes.data || [];
        const allAttendees: any[] = [];
        const guestEventMap: Record<string, string[]> = {};
        for (const event of events) {
          try {
            const attendeesRes = await api.get(`/events/${event.id}/attendees`);
            // Handle paginated response structure
            const attendees = attendeesRes.data.data || attendeesRes.data || [];
            if (Array.isArray(attendees)) {
              attendees.forEach(att => {
                if (att.guest && att.guest.id) {
                  if (!guestEventMap[att.guest.id]) guestEventMap[att.guest.id] = [];
                  guestEventMap[att.guest.id].push(event.name);
                }
              });
              allAttendees.push(...attendees);
            }
          } catch (e) {
            console.error(`Failed to fetch attendees for event ${event.id}:`, e);
          }
        }
        const guestMap: Record<string, Guest> = {};
        allAttendees.forEach(att => {
          if (att.guest && att.guest.id) {
            guestMap[att.guest.id] = {
              ...att.guest,
            };
          }
        });
        setGuests(Object.values(guestMap));
        setGuestEvents(guestEventMap);
        setTotalPages(1);
        setTotalRecords(Object.values(guestMap).length);
      } catch (err) {
        console.error('Failed to fetch guests:', err);
        setError('Failed to fetch guests.');
        setGuests([]);
        setTotalPages(1);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    const fetchGuestsAndEventsForAdmin = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all events
        const eventsRes = await api.get('/events');
        // Handle paginated response structure
        const events = eventsRes.data.data || eventsRes.data || [];
        const allAttendees: any[] = [];
        const guestEventMap: Record<string, Set<string>> = {};
        for (const event of events) {
          try {
            const attendeesRes = await api.get(`/events/${event.id}/attendees`);
            // Handle paginated response structure
            const attendees = attendeesRes.data.data || attendeesRes.data || [];
            if (Array.isArray(attendees)) {
              attendees.forEach(att => {
                if (att.guest && att.guest.id) {
                  if (!guestEventMap[att.guest.id]) guestEventMap[att.guest.id] = new Set();
                  guestEventMap[att.guest.id].add(event.name);
                  allAttendees.push(att);
                }
              });
            }
          } catch (e) {
            console.error(`Failed to fetch attendees for event ${event.id}:`, e);
          }
        }
        // Aggregate unique guests
        const guestMap: Record<string, Guest> = {};
        allAttendees.forEach(att => {
          if (att.guest && att.guest.id) {
            guestMap[att.guest.id] = {
              ...att.guest,
            };
          }
        });
        setGuests(Object.values(guestMap));
        // Convert Set to Array for rendering
        const guestEventArrMap: Record<string, string[]> = {};
        Object.keys(guestEventMap).forEach(id => {
          guestEventArrMap[id] = Array.from(guestEventMap[id]);
        });
        setGuestEvents(guestEventArrMap);
        setTotalPages(1);
        setTotalRecords(Object.values(guestMap).length);
      } catch (err) {
        console.error('Failed to fetch guests:', err);
        setError('Failed to fetch guests.');
        setGuests([]);
        setTotalPages(1);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    // Only organizers can access guests list
    if (user?.role === 'organizer' || user?.role === 'organizer_admin') {
      fetchGuestsForOrganizer();
    } else {
      // Redirect or show error for non-organizers
      setError('Access denied: Only organizers can view guests list.');
      setLoading(false);
    }
  }, [user]);

  // Handle search and filter changes with pagination reset
  const handleSearchChange = (value: string) => {
    setFilter(value);
    resetPagination();
  };

  const handleEventFilterChange = (value: string) => {
    setEventFilter(value);
    resetPagination();
  };

  const handleJobTitleFilterChange = (value: string) => {
    setJobTitleFilter(value);
    resetPagination();
  };

  const handleCompanyFilterChange = (value: string) => {
    setCompanyFilter(value);
    resetPagination();
  };

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value);
    resetPagination();
  };

  const handleGenderFilterChange = (value: string) => {
    setGenderFilter(value);
    resetPagination();
  };

  const handleGuestTypeFilterChange = (value: string) => {
    setGuestTypeFilter(value);
    resetPagination();
  };

  // Apply client-side filtering and pagination
  const filteredGuests = guests.filter(guest => {
    // Apply search filter
    if (filter && !guest.name?.toLowerCase().includes(filter.toLowerCase()) &&
      !guest.email?.toLowerCase().includes(filter.toLowerCase()) &&
      !guest.company?.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }

    // Apply event filter
    if (eventFilter !== 'all') {
      const guestEventNames = guestEvents[guest.id] || [];
      if (!guestEventNames.includes(eventFilter)) {
        return false;
      }
    }

    // Apply job title filter
    if (jobTitleFilter !== 'all' && guest.jobtitle !== jobTitleFilter) {
      return false;
    }

    // Apply company filter
    if (companyFilter !== 'all' && guest.company !== companyFilter) {
      return false;
    }

    // Apply country filter
    if (countryFilter !== 'all' && guest.country !== countryFilter) {
      return false;
    }

    // Apply gender filter
    if (genderFilter !== 'all' && guest.gender !== genderFilter) {
      return false;
    }

    // Apply guest type filter
    if (guestTypeFilter !== 'all' && guest.guest_type?.name !== guestTypeFilter) {
      return false;
    }

    return true;
  });

  // Calculate pagination for filtered results
  const totalFiltered = filteredGuests.length;
  const totalPagesForFiltered = Math.ceil(totalFiltered / perPage);

  // Update pagination totals based on filtered results
  useEffect(() => {
    if (isAdminOrOrganizer) {
      const calculatedTotalPages = Math.ceil(totalFiltered / perPage) || 1;
      setTotalPages(calculatedTotalPages);
      setTotalRecords(totalFiltered);

      // Reset to page 1 if current page is beyond total pages
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        handlePageChange(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalFiltered, perPage, isAdminOrOrganizer, currentPage]);

  // Apply pagination - only show 15 records per page for admin/organizer
  const paginatedGuests = isAdminOrOrganizer
    ? filteredGuests.slice((currentPage - 1) * perPage, currentPage * perPage)
    : filteredGuests;

  // Helper functions to get unique values for filters
  const getUniqueJobTitles = () => {
    const titles = guests.map(g => g.jobtitle).filter(Boolean);
    return Array.from(new Set(titles)).sort();
  };

  const getUniqueCompanies = () => {
    const companies = guests.map(g => g.company).filter(Boolean);
    return Array.from(new Set(companies)).sort();
  };

  const getUniqueCountries = () => {
    const countries = guests.map(g => g.country).filter(Boolean);
    return Array.from(new Set(countries)).sort();
  };

  const getUniqueGenders = () => {
    const genders = guests.map(g => g.gender).filter(Boolean);
    return Array.from(new Set(genders)).sort();
  };

  const getUniqueGuestTypes = () => {
    const types = guests.map(g => g.guest_type?.name).filter(Boolean);
    return Array.from(new Set(types)).sort();
  };

  const getUniqueEvents = () => {
    const allEvents = Object.values(guestEvents).flat();
    return Array.from(new Set(allEvents)).sort();
  };

  // Select all on current page (for paginated view)
  const allSelectedOnPage =
    paginatedGuests.length > 0 &&
    paginatedGuests.every((g) => selected.includes(g.id));

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      // Deselect all on current page
      setSelected(selected.filter((id) => !paginatedGuests.some((g) => g.id === id)));
    } else {
      // Select all on current page
      setSelected([
        ...selected,
        ...paginatedGuests.filter((g) => !selected.includes(g.id)).map((g) => g.id),
      ]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Placeholder handlers for actions
  const handleSendEmail = (ids: string[]) => {
    showInfo('Email Recipients', `Send email to: ${ids.join(', ')}`);
  };
  const handleSendSMS = (ids: string[]) => {
    showInfo('SMS Recipients', `Send SMS to: ${ids.join(', ')}`);
  };

  const clearAllFilters = () => {
    setFilter('');
    setEventFilter('all');
    setJobTitleFilter('all');
    setCompanyFilter('all');
    setCountryFilter('all');
    setGenderFilter('all');
    setGuestTypeFilter('all');
  };

  const exportGuestsToCSV = () => {
    if (!checkPermission('guests.export', 'export guests')) {
      return;
    }

    if (filteredGuests.length === 0) {
      showError('Export Failed', 'No guests to export.');
      return;
    }

    const dataToExport = filteredGuests.map((guest) => {
      return {
        'Guest ID': guest.id,
        'Name': guest.name || 'N/A',
        'Email': guest.email || 'N/A',
        'Phone': guest.phone || 'N/A',
        'Company': guest.company || 'N/A',
        'Job Title': guest.jobtitle || 'N/A',
        'Gender': guest.gender || 'N/A',
        'Country': guest.country || 'N/A',
        'Guest Type': guest.guest_type?.name || 'N/A',
        'Events Attended': (guestEvents[guest.id] || []).join(', ') || 'N/A',
        'Total Events': (guestEvents[guest.id] || []).length || 0,
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `guests_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Export Successful', 'Guest data exported successfully.');
  };

  const exportToPDF = () => {
    exportGuestsToCSV(); // For now, using CSV export
  };

  const exportToExcel = () => {
    exportGuestsToCSV(); // For now, using CSV export
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Manage Guests', href: '/dashboard/guests' },
          { label: 'Guests List' }
        ]}
        className="mb-4"
      />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center border border-border">
              <UsersIcon className="w-7 h-7 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Guests List
                <Star className="w-5 h-5 text-muted-foreground" />
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                Auto-updates in 2 min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={eventFilter} onValueChange={handleEventFilterChange}>
              <SelectTrigger className="w-[140px] bg-background border-border">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {getUniqueEvents().map(event => (
                  <SelectItem key={event} value={event}>{event}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={guestTypeFilter} onValueChange={handleGuestTypeFilterChange}>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {getUniqueGuestTypes().map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="Monthly" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Search and Export */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={filter}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <ProtectedButton
              permission="guests.export"
              onClick={exportToPDF}
              variant="outline"
              size="sm"
              actionName="export guests to PDF"
              className="bg-background border-border hover:bg-accent"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </ProtectedButton>
            <ProtectedButton
              permission="guests.export"
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              actionName="export guests to Excel"
              className="bg-background border-border hover:bg-accent"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </ProtectedButton>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Advanced Filters</h3>
              <p className="text-sm text-muted-foreground">Filter guests by specific criteria</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event Filter */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Event Attendance</Label>
              <Select value={eventFilter} onValueChange={handleEventFilterChange}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {getUniqueEvents().map(event => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Title Filter */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Job Title</Label>
              <Select value={jobTitleFilter} onValueChange={handleJobTitleFilterChange}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All Job Titles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Job Titles</SelectItem>
                  {getUniqueJobTitles().map(title => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Filter */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Company</Label>
              <Select value={companyFilter} onValueChange={handleCompanyFilterChange}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {getUniqueCompanies().map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Country</Label>
              <Select value={countryFilter} onValueChange={handleCountryFilterChange}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {getUniqueCountries().map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender Filter */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Gender</Label>
              <Select value={genderFilter} onValueChange={handleGenderFilterChange}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  {getUniqueGenders().map(gender => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guest Type Filter */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Guest Type</Label>
              <Select value={guestTypeFilter} onValueChange={handleGuestTypeFilterChange}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All Guest Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Guest Types</SelectItem>
                  {getUniqueGuestTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {filteredGuests.length} of {guests.length} guests match your filters
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="bg-white border-gray-200 hover:bg-gray-50"
              >
                Clear All Filters
              </Button>
              <Button
                onClick={() => setShowFilters(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading/Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="xl" variant="primary" text="Loading guests..." />
          <div className="text-sm text-muted-foreground/70 mt-2">Gathering guest data from all events</div>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-lg font-medium text-foreground mb-2">Failed to load guests</div>
          <div className="text-muted-foreground mb-6">{error}</div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Guests Table */}
      {!loading && !error && paginatedGuests.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4 w-12">
                    <Checkbox
                      checked={allSelectedOnPage}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all guests"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Name of Guest</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Company</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Title</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Email</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Phone Number</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4 text-right">Source</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGuests.map(guest => {
                  // Determine status based on guest data
                  const guestStatus = guest.checked_in ? 'checked-in' : 'pending';
                  const statusColors = {
                    'checked-in': 'bg-success/10 text-success border-success/30',
                    'pending': 'bg-warning/10 text-warning border-warning/30',
                    'active': 'bg-success/10 text-success border-success/30',
                  };

                  return (
                    <TableRow
                      key={guest.id}
                      className="hover:bg-accent/50 transition-colors border-b border-border"
                    >
                      <TableCell className="py-4">
                        <Checkbox
                          checked={selected.includes(guest.id)}
                          onCheckedChange={() => toggleSelect(guest.id)}
                          aria-label={`Select guest ${guest.name}`}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-foreground text-sm">
                            {guest.name ? guest.name.charAt(0).toUpperCase() : 'G'}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{guest.name}</div>
                            <div className="text-xs text-muted-foreground">{guest.guest_type?.name || 'Guest'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm font-medium text-foreground">{guest.company || '-'}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-foreground">{guest.jobtitle || '-'}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-foreground">{guest.email}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-foreground">{guest.phone || '-'}</div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {(guestEvents[guest.id] || []).length > 0 ? (guestEvents[guest.id] || [])[0] : 'Direct'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Component - Only for admin and organizer */}
      {!loading && !error && paginatedGuests.length > 0 && isAdminOrOrganizer && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          perPage={perPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredGuests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <UsersIcon className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            {guests.length === 0 ? 'No guests found' : 'No guests match your filters'}
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {guests.length === 0
              ? 'No guest accounts exist in the system yet.'
              : 'Try adjusting your search criteria or filters to find the guests you\'re looking for.'
            }
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setFilter('')}
              className="bg-white border-gray-200 shadow-sm hover:bg-gray-50"
            >
              Clear Search
            </Button>
            {guests.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="bg-white border-gray-200 shadow-sm hover:bg-gray-50"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 