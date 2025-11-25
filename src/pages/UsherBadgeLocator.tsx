import { useState, useRef, useEffect } from 'react'
import {
  Search,
  MapPin,
  CheckCircle,
  AlertCircle,
  Users,
  X,
  XCircle,
  RefreshCw,
  Printer,
  BadgeCheck,
  Box,
  History,
} from 'lucide-react'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { getGuestTypeBadgeClasses } from '@/lib/utils'

// --- Data Model ---
interface BadgeData {
  name: string
  badgeId: string
  registrationId: string
  qrCode: string
  badgeType: string
  guest_type: string
  zone: string
  section: string
  tray: string
  organization: string
  email: string
  notes: string
  status: 'pre-printed' | 'not printed' | 'reprint requested' | 'collected' | 'missing'
  collected: boolean
  printHistory: Array<{
    status: string
    timestamp: string
    staff: string
    note?: string
  }>
}

// --- Components ---
function SearchBarWithAutocomplete({ badges, onSelect, isSearching }: { badges: BadgeData[], onSelect: (badge: BadgeData) => void, isSearching?: boolean }) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState<BadgeData[]>([]);

  useEffect(() => {
    if (!input) {
      setFiltered([]);
      setShowDropdown(false);
      return;
    }
    const lower = input.toLowerCase();
    const matches = badges.filter(badge =>
      badge.name.toLowerCase().includes(lower) ||
      badge.qrCode.toLowerCase().includes(lower) ||
      badge.registrationId.toLowerCase().includes(lower) ||
      badge.organization.toLowerCase().includes(lower)
    );
    setFiltered(matches.slice(0, 8));
    setShowDropdown(matches.length > 0);
  }, [input, badges]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by name, QR code, registration ID, or company..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setShowDropdown(filtered.length > 0)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full pl-10 pr-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-10 w-full bg-popover border border-border rounded shadow-lg mt-1 max-h-60 overflow-auto">
          {filtered.map((badge, idx) => (
            <div
              key={badge.badgeId + idx}
              className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
              onMouseDown={() => { onSelect(badge); setInput(''); setShowDropdown(false); }}
            >
              <span className="font-medium">{badge.name}</span> <span className="text-muted-foreground">({badge.organization})</span>
              <div className="text-xs text-muted-foreground/70">ID: {badge.registrationId} | QR: {badge.qrCode}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-muted-foreground text-sm">No results</div>
          )}
        </div>
      )}
    </div>
  );
}

function BadgeResultPanel({ badge, user, onAction }: { badge: BadgeData, user: any, onAction: (action: string) => void }) {
  // Print status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pre-printed':
        return <CheckCircle className="inline w-5 h-5 text-green-600 mr-1" title="Pre-printed" />;
      case 'not printed':
        return <XCircle className="inline w-5 h-5 text-red-600 mr-1" title="Not printed" />;
      case 'reprint requested':
        return <RefreshCw className="inline w-5 h-5 text-yellow-600 mr-1" title="Reprint requested" />;
      case 'missing':
        return <AlertCircle className="inline w-5 h-5 text-red-600 mr-1" title="Missing" />;
      case 'collected':
        return <CheckCircle className="inline w-5 h-5 text-green-600 mr-1" title="Collected" />;
      default:
        return <Box className="inline w-5 h-5 text-muted-foreground mr-1" title="Unknown status" />;
    }
  };

  return (
    <DashboardCard title="Badge Details" icon={<BadgeCheck className="w-6 h-6 text-blue-600" />}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-lg text-card-foreground">{badge.name}</span>
            <span className="ml-2 text-xs text-muted-foreground/70">({badge.organization})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Badge Type:</span>
            <span className="font-medium">{badge.badgeType}</span>
            <span className="ml-4 text-muted-foreground">Guest Type:</span>
            <Badge className={getGuestTypeBadgeClasses(badge.guest_type)}>
              {badge.guest_type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Registration ID:</span>
            <span className="font-mono">{badge.registrationId}</span>
            <span className="ml-4 text-muted-foreground">QR:</span>
            <span className="font-mono">{badge.qrCode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span>{badge.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>Zone <b>{badge.zone}</b>, Section <b>{badge.section}</b>, Tray <b>{badge.tray}</b></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Notes:</span>
            <span>{badge.notes || <span className="italic text-muted-foreground/70">None</span>}</span>
          </div>
        </div>
        {/* Right: Status & Actions */}
        <div className="flex flex-col gap-4 min-w-[220px]">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Print Status:</span>
            {getStatusIcon(badge.status)}
            <span className="font-medium capitalize">{badge.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Collected:</span>
            {badge.collected ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {!badge.collected && (
              <button
                className="w-full flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                onClick={() => onAction('mark-collected')}
              >
                <CheckCircle className="w-4 h-4" /> Mark as Collected
              </button>
            )}
            
            {badge.status !== 'reprint requested' && (
              <button
                className="w-full flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition"
                onClick={() => onAction('request-reprint')}
              >
                <RefreshCw className="w-4 h-4" /> Request Reprint
              </button>
            )}
            
            {badge.status !== 'missing' && (
              <button
                className="w-full flex items-center gap-2 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                onClick={() => onAction('mark-missing')}
              >
                <XCircle className="w-4 h-4" /> Mark as Missing
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function HistoryLog({ history }: { history: BadgeData['printHistory'] }) {
  if (!history || history.length === 0) {
    return (
      <DashboardCard title="Badge History" icon={<History className="w-6 h-6 text-muted-foreground" />}>
        <div className="text-muted-foreground/70 italic">No history available.</div>
      </DashboardCard>
    );
  }
  return (
    <DashboardCard title="Badge History" icon={<History className="w-6 h-6 text-muted-foreground" />}>
      <ul className="divide-y divide-border">
        {history.map((entry, idx) => (
          <li key={idx} className="py-2 flex items-center gap-4">
            <span className="text-xs text-muted-foreground/70 w-32">{entry.timestamp}</span>
            <span className="font-medium text-card-foreground">{entry.status}</span>
            <span className="text-muted-foreground/70 text-xs">by {entry.staff}</span>
            {entry.note && <span className="text-blue-600 text-xs italic">{entry.note}</span>}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

export default function UsherBadgeLocator() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [data, setData] = useState<BadgeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<BadgeData | null>(null);
  const [searchResults, setSearchResults] = useState<BadgeData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch events assigned to this usher
  useEffect(() => {
    setLoadingEvents(true);
    setEventError(null);
    
    const isMockAuth = localStorage.getItem('mock_auth') === 'true';
    
    if (isMockAuth) {
      // Use mock data for development
      console.log('[UsherBadgeLocator] Using mock events data');
      const mockEvents = [
        {
          id: 1,
          name: 'Tech Conference 2024',
          start_date: '2024-12-15T09:00:00Z',
          end_date: '2024-12-15T17:00:00Z',
          status: 'active',
          organizer_id: 1
        }
      ];
      setEvents(mockEvents);
      setLoadingEvents(false);
      return;
    }
    
    api.get('/events')
      .then(res => {
        const eventsData = res.data?.data || res.data || [];
        // Remove duplicates based on event ID
        const uniqueEvents = eventsData.filter((event: any, index: number, self: any[]) => 
          index === self.findIndex((e: any) => e.id === event.id)
        );
        // Filter events where user is assigned as usher
        const assignedEvents = uniqueEvents.filter((event: any) => 
          event.ushers && event.ushers.some((usher: any) => usher.user_id === user?.id)
        );
        setEvents(assignedEvents);
        if (assignedEvents.length === 1) {
          setSelectedEventId(assignedEvents[0].id.toString());
        }
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        setEventError('Failed to load assigned events. Please refresh the page.');
      })
      .finally(() => setLoadingEvents(false));
  }, [user]);

  // Fetch badge locator data for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    
    setData([]);
    setSelectedGuest(null);
    
    const isMockAuth = localStorage.getItem('mock_auth') === 'true';
    
    if (isMockAuth) {
      // Use mock badge data for development
      console.log('[UsherBadgeLocator] Using mock badge data for event:', selectedEventId);
      const mockBadgeData = [
        {
          name: 'John Doe',
          badgeId: '12345',
          registrationId: 'REG-001',
          qrCode: 'QR12345',
          badgeType: 'VIP',
          guest_type: 'VIP',
          zone: 'A',
          section: '1',
          tray: 'A1',
          organization: 'Tech Corp',
          email: 'john.doe@example.com',
          notes: 'Speaker',
          status: 'pre-printed',
          collected: false,
          printHistory: [
            { status: 'pre-printed', timestamp: '2024-07-20 09:00', staff: 'Admin', note: 'Initial print' }
          ]
        },
        {
          name: 'Jane Smith',
          badgeId: '12346',
          registrationId: 'REG-002',
          qrCode: 'QR12346',
          badgeType: 'Attendee',
          guest_type: 'Attendee',
          zone: 'B',
          section: '2',
          tray: 'B2',
          organization: 'Biz Group',
          email: 'jane.smith@biz.com',
          notes: '',
          status: 'not printed',
          collected: false,
          printHistory: []
        }
      ];
      setData(mockBadgeData);
      toast.success(`Loaded ${mockBadgeData.length} badges for this event (mock data).`);
      return;
    }
    
    api.get(`/events/${selectedEventId}/badge-locator`)
      .then(res => {
        if (res.data && res.data.data) {
          setData(res.data.data);
          toast.success(`Loaded ${res.data.data.length} badges for this event.`);
        } else {
          setData([]);
          toast.info('No badge location data found for this event.');
        }
      })
      .catch(err => {
        console.error('Failed to load badge locator data:', err);
        setData([]);
        if (err.response?.status === 404) {
          toast.info('No badge location data found for this event.');
        } else {
          toast.error('Failed to load badge location data.');
        }
      });
  }, [selectedEventId]);

  // Debounced search effect
  useEffect(() => {
    if (!selectedEventId || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const isMockAuth = localStorage.getItem('mock_auth') === 'true';
    
    if (isMockAuth) {
      // Use local filtering in mock mode
      const filtered = data.filter((row) => {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          row.name,
          row.badgeId,
          row.registrationId,
          row.qrCode,
          row.organization,
          row.email,
          row.zone,
          row.section,
          row.tray,
          row.guest_type,
          row.badgeType
        ];
        
        return searchableFields.some(field => 
          String(field).toLowerCase().includes(searchLower)
        );
      });
      setSearchResults(filtered);
      return;
    }

    // Real-time search with backend
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/events/${selectedEventId}/badge-locator/search`, {
          params: { q: searchTerm }
        });
        setSearchResults(response.data.badges || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, selectedEventId, data]);

  // Use search results if searching, otherwise use all data
  const filteredData = searchTerm.trim() ? searchResults : data;

  // Action handler for badge actions
  const handleBadgeAction = async (action: string) => {
    if (!selectedGuest || !selectedEventId) return;

    const isMockAuth = localStorage.getItem('mock_auth') === 'true';
    
    // Map action to backend status
    const statusMap: Record<string, string> = {
      'mark-collected': 'collected',
      'mark-missing': 'missing',
      'request-reprint': 'reprint_requested'
    };

    const status = statusMap[action];
    if (!status) {
      toast.error(`Unknown action: ${action}`);
      return;
    }

    try {
      if (isMockAuth) {
        // Simulate API call in mock mode
        setTimeout(() => {
          updateBadgeInState(status, 'Action performed in mock mode');
          toast.success(`Marked ${selectedGuest.name} as ${status.replace('_', ' ')}.`);
        }, 500);
      } else {
        // Make real API call
        const response = await api.post(`/events/${selectedEventId}/badge-locator/update-status`, {
          badgeId: selectedGuest.badgeId,
          status: status,
          note: `Action performed by usher: ${user?.name || user?.email || 'Current User'}`
        });

        if (response.data) {
          updateBadgeInState(status, response.data.badge?.printHistory?.[response.data.badge.printHistory.length - 1]?.note || '');
          toast.success(`Marked ${selectedGuest.name} as ${status.replace('_', ' ')}.`);
        }
      }
    } catch (error) {
      console.error('Failed to update badge status:', error);
      toast.error('Failed to update badge status. Please try again.');
    }
  };

  // Helper function to update badge in state
  const updateBadgeInState = (status: string, note: string) => {
    const timestamp = new Date().toISOString();
    const staff = user?.name || user?.email || 'Current User';

    setData(prevData => prevData.map(badge =>
      badge.badgeId === selectedGuest!.badgeId
        ? { 
            ...badge, 
            status: status,
            collected: status === 'collected',
            printHistory: [
              ...badge.printHistory,
              {
                status: status,
                timestamp: timestamp,
                staff: staff,
                note: note
              }
            ]
          }
        : badge
    ));

    setSelectedGuest(prev => prev ? { 
      ...prev, 
      status: status,
      collected: status === 'collected',
      printHistory: [
        ...prev.printHistory,
        {
          status: status,
          timestamp: timestamp,
          staff: staff,
          note: note
        }
      ]
    } : prev);
  };

  return (
    <div className="space-y-6">
      {/* Development Mode Notice */}
      {localStorage.getItem('mock_auth') === 'true' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">Development Mode</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            You're currently using mock data for development. In production, this will connect to the live API.
          </p>
        </div>
      )}
      
      {/* --- Event Selector --- */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Select Assigned Event</label>
          {selectedEventId && (
            <Badge variant="outline" className="text-xs">
              {data.length} badges loaded
            </Badge>
          )}
        </div>
        <Select 
          value={selectedEventId} 
          onValueChange={(value) => {
            setSelectedEventId(value);
            setSelectedGuest(null);
          }}
          disabled={loadingEvents}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder={loadingEvents ? 'Loading events...' : 'Choose an assigned event'} />
          </SelectTrigger>
          <SelectContent>
            {events.map((event: any, index: number) => (
              <SelectItem key={`usher-event-${event.id}-${index}`} value={event.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{event.name}</span>
                  <span className="text-xs text-muted-foreground/70">
                    {new Date(event.start_date).toLocaleDateString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {eventError && (
          <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {eventError}
          </div>
        )}
        {!selectedEventId && !loadingEvents && (
          <div className="text-amber-600 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Please select an assigned event to view badge locations
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Badge Locator</h1>
          <p className="text-muted-foreground mt-1">Search and manage guest badges for your assigned events.</p>
        </div>
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-2">
          <SearchBarWithAutocomplete badges={filteredData} onSelect={setSelectedGuest} isSearching={isSearching} />
        </div>
      </div>

      {/* Statistics Summary */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Badges</span>
            </div>
            <div className="text-2xl font-bold text-card-foreground mt-1">{data.length}</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Collected</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {data.filter(b => b.collected).length}
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-muted-foreground">Missing</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {data.filter(b => b.status === 'missing').length}
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Reprint Needed</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {data.filter(b => b.status === 'reprint requested').length}
            </div>
          </div>
        </div>
      )}

      {selectedGuest && (
        <>
          <BadgeResultPanel badge={selectedGuest} user={user} onAction={handleBadgeAction} />
          <HistoryLog history={selectedGuest.printHistory} />
        </>
      )}
    </div>
  )
}
