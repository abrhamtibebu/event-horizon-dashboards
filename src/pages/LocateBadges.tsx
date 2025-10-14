import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  Download,
  Search,
  MapPin,
  Filter,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  X,
  XCircle,
  RefreshCw,
  Pencil,
  Printer,
  BadgeCheck,
  Box,
  History,
  Edit2,
  Calendar,
  Hash,
  QrCode,
  Mail,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Papa from 'papaparse'
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
  status: 'pre-printed' | 'not printed' | 'reprint requested'
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
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        placeholder="Search by name, QR code, registration ID, or company..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onFocus={() => setShowDropdown(filtered.length > 0)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full h-12 pl-12 pr-12 text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        )}
        {input && !isSearching && (
          <button
            onClick={() => { setInput(''); setShowDropdown(false); }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 max-h-80 overflow-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
            </div>
          {filtered.map((badge, idx) => (
            <div
              key={badge.badgeId + idx}
                className="px-3 py-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors duration-150"
              onMouseDown={() => { onSelect(badge); setInput(''); setShowDropdown(false); }}
            >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{badge.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {badge.badgeType}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{badge.organization}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {badge.registrationId} • QR: {badge.qrCode}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant={badge.collected ? "default" : "secondary"}
                      className={`text-xs ${
                        badge.collected 
                          ? 'bg-green-100 text-green-800' 
                          : badge.status === 'missing' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {badge.collected ? 'Collected' : badge.status}
                    </Badge>
                    {badge.zone && badge.section && badge.tray && (
                      <div className="text-xs text-gray-500">
                        {badge.zone}-{badge.section}-{badge.tray}
                      </div>
                    )}
                  </div>
                </div>
            </div>
          ))}
          {filtered.length === 0 && (
              <div className="px-3 py-4 text-gray-500 text-sm text-center">
                No badges found matching your search
              </div>
          )}
          </div>
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
        return <Box className="inline w-5 h-5 text-gray-400 mr-1" title="Unknown status" />;
    }
  };
  // Permission check
  const canEdit = user && (user.role === 'admin' || user.role === 'supervisor');
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BadgeCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Badge Details</h3>
            <p className="text-sm text-gray-600">Guest information and status</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest Information */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">{badge.name}</h4>
                <p className="text-gray-600">{badge.organization}</p>
                <div className="flex items-center gap-2 mt-2">
            <Badge className={getGuestTypeBadgeClasses(badge.guest_type)}>
              {badge.guest_type}
            </Badge>
                  <Badge variant="outline" className="text-xs">
                    {badge.badgeType}
                  </Badge>
          </div>
          </div>
          </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Hash className="w-4 h-4 text-blue-600" />
          </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration ID</p>
                    <p className="font-mono text-sm font-medium">{badge.registrationId}</p>
          </div>
        </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <QrCode className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">QR Code</p>
                    <p className="font-mono text-sm font-medium">{badge.qrCode}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium">{badge.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-sm font-medium">Zone {badge.zone}, Section {badge.section}, Tray {badge.tray}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {badge.notes && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-sm">{badge.notes}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Status & Actions */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Status</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Print Status</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(badge.status)}
                    <span className="text-sm font-medium capitalize">{badge.status}</span>
          </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Collected</span>
          <div className="flex items-center gap-2">
                    {badge.collected ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {badge.collected ? 'Yes' : 'No'}
                    </span>
          </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-900">Actions</h5>
              {!badge.collected && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onAction('mark-collected')}
            >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Collected
                </Button>
              )}
              
              {badge.status !== 'reprint requested' && (
                <Button
                  variant="outline"
                  className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  onClick={() => onAction('request-reprint')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Reprint
                </Button>
              )}
              
              {badge.status !== 'missing' && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => onAction('mark-missing')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Mark as Missing
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => onAction('print-badge')}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Badge
              </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function TrayLayoutView({ badges }: { badges: BadgeData[] }) {
  const [selectedTray, setSelectedTray] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Group badges by zone, section, tray
  const grouped = badges.reduce((acc, badge) => {
    acc[badge.zone] = acc[badge.zone] || {};
    acc[badge.zone][badge.section] = acc[badge.zone][badge.section] || {};
    acc[badge.zone][badge.section][badge.tray] = acc[badge.zone][badge.section][badge.tray] || [];
    acc[badge.zone][badge.section][badge.tray].push(badge);
    return acc;
  }, {} as Record<string, Record<string, Record<string, BadgeData[]>>>);

  // Flatten to trayList with statistics
  const trayList: Array<{
    zone: string;
    section: string;
    tray: string;
    badges: BadgeData[];
    collected: number;
    total: number;
    missing: number;
  }> = [];

  Object.entries(grouped).forEach(([zone, sections]) => {
    Object.entries(sections).forEach(([section, trays]) => {
      Object.entries(trays).forEach(([tray, trayBadges]) => {
        const collected = trayBadges.filter(b => b.collected).length;
        const missing = trayBadges.filter(b => b.status === 'missing').length;
        trayList.push({ 
          zone, 
          section, 
          tray, 
          badges: trayBadges,
          collected,
          total: trayBadges.length,
          missing
        });
      });
    });
  });

  // Sort trays by zone, section, tray
  trayList.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.tray.localeCompare(b.tray);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pre-printed': return 'text-green-600';
      case 'not printed': return 'text-red-600';
      case 'reprint requested': return 'text-yellow-600';
      case 'missing': return 'text-red-500';
      case 'collected': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pre-printed': return <CheckCircle className="w-3 h-3" />;
      case 'not printed': return <XCircle className="w-3 h-3" />;
      case 'reprint requested': return <RefreshCw className="w-3 h-3" />;
      case 'missing': return <AlertCircle className="w-3 h-3" />;
      case 'collected': return <CheckCircle className="w-3 h-3" />;
      default: return <Box className="w-3 h-3" />;
    }
  };

  if (badges.length === 0) {
  return (
    <DashboardCard title="Tray Layout" icon={<Box className="w-6 h-6 text-blue-500" />}>
        <div className="text-center py-8 text-gray-500">
          <Box className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No badge location data available.</p>
          <p className="text-sm">Upload a CSV file to organize badges by tray.</p>
            </div>
      </DashboardCard>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Box className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tray Layout</h3>
              <p className="text-sm text-gray-600">Organized by zones, sections, and trays</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg">
            {trayList.length} trays • {badges.length} total badges
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
                <SelectItem value="not printed">Not Printed</SelectItem>
                <SelectItem value="reprint requested">Reprint Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trayList.map(({ zone, section, tray, badges: trayBadges, collected, total, missing }) => {
          const filteredBadges = filterStatus === 'all' 
            ? trayBadges 
            : trayBadges.filter(badge => badge.status === filterStatus || badge.collected === (filterStatus === 'collected'));

          if (filteredBadges.length === 0) return null;

          return (
            <div 
              key={`${zone}-${section}-${tray}`} 
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
                selectedTray === `${zone}-${section}-${tray}` ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-blue-300'
              }`}
              onClick={() => setSelectedTray(selectedTray === `${zone}-${section}-${tray}` ? null : `${zone}-${section}-${tray}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Box className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Zone {zone} • Section {section}
                    </div>
                    <div className="text-sm text-gray-600">Tray {tray}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">{collected}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-600 font-medium">{missing}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600 font-medium">{total}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredBadges.map((badge) => (
                  <div 
                    key={badge.badgeId} 
                    className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(badge.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{badge.name}</div>
                      <div className="text-xs text-gray-500 truncate">{badge.organization}</div>
                    </div>
                    <Badge className={`text-xs ${getGuestTypeBadgeClasses(badge.guest_type)}`}>
                      {badge.guest_type}
                    </Badge>
          </div>
        ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}


function HistoryLog({ history }: { history: BadgeData['printHistory'] }) {
  if (!history || history.length === 0) {
    return (
      <DashboardCard title="Badge History" icon={<History className="w-6 h-6 text-gray-500" />}>
        <div className="text-gray-400 italic">No history available.</div>
      </DashboardCard>
    );
  }
  return (
    <DashboardCard title="Badge History" icon={<History className="w-6 h-6 text-gray-500" />}>
      <ul className="divide-y divide-gray-100">
        {history.map((entry, idx) => (
          <li key={idx} className="py-2 flex items-center gap-4">
            <span className="text-xs text-gray-500 w-32">{entry.timestamp}</span>
            <span className="font-medium text-gray-800">{entry.status}</span>
            <span className="text-gray-500 text-xs">by {entry.staff}</span>
            {entry.note && <span className="text-blue-600 text-xs italic">{entry.note}</span>}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

export default function LocateBadges() {
  const { user } = useAuth();
  // --- New state for event selection ---
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  // Badge data state
  const [data, setData] = useState<BadgeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGuest, setSelectedGuest] = useState<BadgeData | null>(null)
  const [selectedZone, setSelectedZone] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'located':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'missing':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGuestTypeColor = (type: string) => {
    return getGuestTypeBadgeClasses(type);
  }

  // Fetch events on mount
  useEffect(() => {
    setLoadingEvents(true);
    setEventError(null);
    
    // Check if we're in mock authentication mode
    const isMockAuth = localStorage.getItem('mock_auth') === 'true';
    
    if (isMockAuth) {
      // Use mock data for development
      console.log('[LocateBadges] Using mock events data');
      const mockEvents = [
        {
          id: 1,
          name: 'Tech Conference 2024',
          start_date: '2024-12-15T09:00:00Z',
          end_date: '2024-12-15T17:00:00Z',
          status: 'active',
          organizer_id: 1
        },
        {
          id: 2,
          name: 'Business Summit 2024',
          start_date: '2024-12-20T10:00:00Z',
          end_date: '2024-12-20T18:00:00Z',
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
        setEvents(uniqueEvents);
        // Auto-select first event if only one available
        if (uniqueEvents.length === 1) {
          setSelectedEventId(uniqueEvents[0].id.toString());
        }
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        setEventError('Failed to load events. Please refresh the page.');
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  // Fetch badge locator data for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    
    // Clear previous data
    setData([]);
    setSelectedGuest(null);
    
    // Check if we're in mock authentication mode
    const isMockAuth = localStorage.getItem('mock_auth') === 'true';
    
    if (isMockAuth) {
      // Use mock badge data for development
      console.log('[LocateBadges] Using mock badge data for event:', selectedEventId);
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
        },
        {
          name: 'Alice Lee',
          badgeId: '12347',
          registrationId: 'REG-003',
          qrCode: 'QR12347',
          badgeType: 'Speaker',
          guest_type: 'Speaker',
          zone: 'C',
          section: '3',
          tray: 'C3',
          organization: 'Alpha Inc',
          email: 'alice.lee@alpha.com',
          notes: '',
          status: 'reprint requested',
          collected: false,
          printHistory: [
            { status: 'not printed', timestamp: '2024-07-20 08:00', staff: 'Admin' },
            { status: 'reprint requested', timestamp: '2024-07-20 10:00', staff: 'Supervisor', note: 'Badge damaged' }
          ]
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
          toast.info('No badge location data found for this event. Upload a CSV to get started.');
        }
      })
      .catch(err => {
        console.error('Failed to load badge locator data:', err);
        setData([]);
        if (err.response?.status === 404) {
          toast.info('No badge location data found for this event. Upload a CSV to get started.');
        } else {
          toast.error('Failed to load badge location data.');
        }
      });
  }, [selectedEventId]);

  // CSV upload handler (updated to assign to selected event)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selectedEventId) {
      toast.error('Please select an event before uploading CSV.');
      return;
    }
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.loading('Parsing CSV file...', { id: 'csv-upload' });

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
        if (result.errors.length > 0) {
          toast.error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`, { id: 'csv-upload' });
          return;
        }

          // Map/validate fields to BadgeData
        const parsed = (result.data as any[]).map((row, index) => ({
          name: row.name || row.Name || '',
          badgeId: row.badgeId || row.badge_id || row.BadgeID || '',
          registrationId: row.registrationId || row.registration_id || row.RegistrationID || '',
          qrCode: row.qrCode || row.qr_code || row.QRCode || '',
          badgeType: row.badgeType || row.badge_type || row.BadgeType || '',
          guest_type: row.guest_type || row.guestType || row.GuestType || '',
          zone: row.zone || row.Zone || '',
          section: row.section || row.Section || '',
          tray: row.tray || row.Tray || '',
          organization: row.organization || row.Organization || row.company || row.Company || '',
          email: row.email || row.Email || '',
          notes: row.notes || row.Notes || '',
            status: (row.status as any) || 'not printed',
          collected: row.collected === 'true' || row.collected === true || false,
            printHistory: [],
          }));

        // Validate required fields
        const invalidRows = parsed.filter((row, index) => 
          !row.name || !row.badgeId || !row.registrationId
        );

        if (invalidRows.length > 0) {
          toast.error(`Found ${invalidRows.length} rows with missing required fields (name, badgeId, registrationId)`, { id: 'csv-upload' });
          return;
        }

        toast.loading('Uploading badge data...', { id: 'csv-upload' });

        // Check if we're in mock authentication mode
        const isMockAuth = localStorage.getItem('mock_auth') === 'true';
        
        if (isMockAuth) {
          // Simulate upload in mock mode
          setTimeout(() => {
            setData(parsed);
            setSelectedGuest(null);
            toast.success(`Successfully uploaded ${parsed.length} badges for this event (mock mode).`, { id: 'csv-upload' });
          }, 1000);
          return;
        }

          // Send to backend
          api.post(`/events/${selectedEventId}/badge-locator`, { data: parsed })
            .then(res => {
              setData(parsed);
              setSelectedGuest(null);
            toast.success(`Successfully uploaded ${parsed.length} badges for this event.`, { id: 'csv-upload' });
            })
            .catch(err => {
            console.error('Upload error:', err);
            
            // Handle detailed validation errors
            if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
              const errorDetails = err.response.data.details.slice(0, 3).join(', ');
              const remainingErrors = err.response.data.details.length - 3;
              const errorMessage = errorDetails + (remainingErrors > 0 ? ` and ${remainingErrors} more errors` : '');
              toast.error(`Validation errors: ${errorMessage}`, { id: 'csv-upload' });
            } else {
              toast.error(err.response?.data?.error || 'Failed to upload badge locator data.', { id: 'csv-upload' });
            }
            });
        },
        error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`, { id: 'csv-upload' });
        },
      });
  };

  // Sample CSV download
  const downloadSampleCsv = () => {
    const sample = [
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
        collected: 'false',
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
        collected: 'false',
      },
    ];
    const csv = Papa.unparse(sample);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'sample_badges.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enhanced search functionality with backend integration
  const [searchResults, setSearchResults] = useState<BadgeData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      if (action === 'print-badge') {
        toast.info(`Print badge functionality would be implemented here for ${selectedGuest.name}`);
        return;
      }
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
          note: `Action performed by ${user?.name || user?.email || 'Current User'}`
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Development Mode Notice */}
          {localStorage.getItem('mock_auth') === 'true' && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
      </div>
                <div>
                  <span className="text-sm text-blue-800 font-semibold">Development Mode</span>
                  <p className="text-sm text-blue-700 mt-1">
                    You're currently using mock data for development. In production, this will connect to the live API.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Badge Locator</h1>
                  <p className="text-gray-600 mt-1">Find and manage guest badges with ease</p>
                </div>
              </div>
            </div>
            
            {/* Event Selector */}
            <div className="lg:w-96">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Select Event
                  </label>
                  {selectedEventId && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {data.length} badges
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
                  <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={loadingEvents ? 'Loading events...' : 'Choose an event'} />
          </SelectTrigger>
          <SelectContent>
                    {events.map((event: any, index: number) => (
                      <SelectItem key={`event-${event.id}-${index}`} value={event.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.start_date).toLocaleDateString()}
                          </span>
                        </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
                {eventError && (
                  <div className="text-red-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {eventError}
      </div>
                )}
                {!selectedEventId && !loadingEvents && (
                  <div className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please select an event to view badge locations
        </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Badges</h2>
              <p className="text-gray-600 mb-4">Search by name, QR code, registration ID, or company</p>
              <div className="max-w-2xl">
                <SearchBarWithAutocomplete badges={filteredData} onSelect={setSelectedGuest} isSearching={isSearching} />
              </div>
            </div>
            
            {/* Organizer Actions */}
          {user?.role === 'organizer' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-gray-700">Badge Management</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-10 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={downloadSampleCsv}
              >
                    <Download className="w-4 h-4" />
                    Download Sample
                  </Button>
                  <Button
                    className="flex items-center gap-2 h-10 bg-green-600 hover:bg-green-700"
                onClick={() => fileInputRef.current?.click()}
              >
                    <Upload className="w-4 h-4" />
                    Upload CSV
                  </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
                </div>
            </div>
          )}
        </div>
      </div>

        {/* Statistics Dashboard */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Badges</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{data.length}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-xl">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Collected</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {data.filter(b => b.collected).length}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Missing</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">
                    {data.filter(b => b.status === 'missing').length}
                  </p>
                </div>
                <div className="p-3 bg-red-200 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Reprint Needed</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">
                    {data.filter(b => b.status === 'reprint requested').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Badge Details */}
      {selectedGuest && (
          <div className="space-y-6 mb-8">
          <BadgeResultPanel badge={selectedGuest} user={user} onAction={handleBadgeAction} />
          <HistoryLog history={selectedGuest.printHistory} />
          </div>
      )}

        {/* Tray Layout */}
      <TrayLayoutView badges={data} />
      </div>
    </div>
  )
}
