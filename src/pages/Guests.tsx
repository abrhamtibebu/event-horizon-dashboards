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
import { Search, Users as UsersIcon, Mail, MessageSquare, Filter, Download } from 'lucide-react';
import { getAllGuests, getMyEvents } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
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
  
  // Pagination hook
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

    if (user?.role === 'organizer') {
      fetchGuestsForOrganizer();
    } else {
      fetchGuestsAndEventsForAdmin();
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

  // Since we're now using server-side pagination, we don't need client-side filtering
  const filteredGuests = guests;

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

  const allSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g) => selected.includes(g.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(selected.filter((id) => !filteredGuests.some((g) => g.id === id)));
    } else {
      setSelected([
        ...selected,
        ...filteredGuests.filter((g) => !selected.includes(g.id)).map((g) => g.id),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Guest Management
            </h1>
            <p className="text-gray-600">
              View and manage all guests across events
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="bg-white border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={exportGuestsToCSV}
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            className="bg-white border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2"
            disabled={selected.length === 0}
            onClick={() => handleSendEmail(selected)}
          >
            <Mail className="w-4 h-4" /> Send Email
          </Button>
          <Button
            variant="outline"
            className="bg-white border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2"
            disabled={selected.length === 0}
            onClick={() => handleSendSMS(selected)}
          >
            <MessageSquare className="w-4 h-4" /> Send SMS
          </Button>
        </div>
      </div>

      {/* Content Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Guests</h2>
            <p className="text-gray-600 mt-1">
              {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} found
              {filteredGuests.length !== guests.length && (
                <span className="text-blue-600"> (filtered from {guests.length} total)</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(eventFilter !== 'all' || jobTitleFilter !== 'all' || companyFilter !== 'all' || 
                countryFilter !== 'all' || genderFilter !== 'all' || guestTypeFilter !== 'all') && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Button>

      {/* Search Bar */}
            <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
                placeholder="Search guests by name, email, company..."
          value={filter}
          onChange={e => handleSearchChange(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
        />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              <p className="text-sm text-gray-600">Filter guests by specific criteria</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Event Attendance</Label>
              <Select value={eventFilter} onValueChange={handleEventFilterChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Job Title</Label>
              <Select value={jobTitleFilter} onValueChange={handleJobTitleFilterChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Company</Label>
              <Select value={companyFilter} onValueChange={handleCompanyFilterChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Country</Label>
              <Select value={countryFilter} onValueChange={handleCountryFilterChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Gender</Label>
              <Select value={genderFilter} onValueChange={handleGenderFilterChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Guest Type</Label>
              <Select value={guestTypeFilter} onValueChange={handleGuestTypeFilterChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
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
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
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
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Loading guests...</div>
          <div className="text-sm text-gray-500 mt-2">Gathering guest data from all events</div>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-lg font-medium text-gray-900 mb-2">Failed to load guests</div>
          <div className="text-gray-600 mb-6">{error}</div>
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
      {!loading && !error && filteredGuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Guest List</h3>
                <p className="text-sm text-gray-600">Comprehensive view of all guests</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all guests"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Guest</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Details</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Events</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map(guest => (
                  <TableRow
                    key={guest.id}
                    className="hover:bg-gray-50 transition-colors group border-b border-gray-100"
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
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-white shadow-sm">
                          {guest.name
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{guest.name}</div>
                          <div className="text-sm text-gray-500">{guest.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{guest.email}</div>
                        <div className="text-sm text-gray-600">{guest.phone || 'No phone'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{guest.company || 'No company'}</div>
                        <div className="text-sm text-gray-600">{guest.jobtitle || 'No title'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">{guest.gender || 'Not specified'}</div>
                        <div className="text-sm text-gray-600">{guest.country || 'No country'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-900">
                          {(guestEvents[guest.id] || []).slice(0, 2).join(', ')}
                          {(guestEvents[guest.id] || []).length > 2 && (
                            <span className="text-gray-500"> +{(guestEvents[guest.id] || []).length - 2} more</span>
                          )}
                        </div>
                        {(guestEvents[guest.id] || []).length === 0 && (
                          <span className="text-sm text-gray-500">No events</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white border-gray-200 hover:bg-gray-50"
                          onClick={() => handleSendEmail([guest.id])}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white border-gray-200 hover:bg-gray-50"
                          onClick={() => handleSendSMS([guest.id])}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          SMS
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Component */}
      {!loading && !error && filteredGuests.length > 0 && (
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
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <UsersIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {guests.length === 0 ? 'No guests found' : 'No guests match your filters'}
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
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