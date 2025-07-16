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

// --- Data Model ---
interface BadgeData {
  name: string
  badgeId: string
  registrationId: string
  qrCode: string
  badgeType: string
  guestType: string
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
function SearchBarWithAutocomplete({ badges, onSelect }: { badges: BadgeData[], onSelect: (badge: BadgeData) => void }) {
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
      <Input
        placeholder="Search by name, QR code, registration ID, or company..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onFocus={() => setShowDropdown(filtered.length > 0)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        className="w-full"
      />
      {showDropdown && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-auto">
          {filtered.map((badge, idx) => (
            <div
              key={badge.badgeId + idx}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              onMouseDown={() => { onSelect(badge); setInput(''); setShowDropdown(false); }}
            >
              <span className="font-medium">{badge.name}</span> <span className="text-gray-500">({badge.organization})</span>
              <div className="text-xs text-gray-400">ID: {badge.registrationId} | QR: {badge.qrCode}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-gray-400 text-sm">No results</div>
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
        return <RefreshCw className="inline w-5 h-5 text-yellow-600 mr-1 animate-spin" title="Reprint requested" />;
      default:
        return null;
    }
  };
  // Permission check
  const canEdit = user && (user.role === 'admin' || user.role === 'supervisor');
  return (
    <DashboardCard title="Badge Details" icon={<BadgeCheck className="w-6 h-6 text-blue-600" />}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-lg text-gray-900">{badge.name}</span>
            <span className="ml-2 text-xs text-gray-500">({badge.organization})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Badge Type:</span>
            <span className="font-medium">{badge.badgeType}</span>
            <span className="ml-4 text-gray-500">Guest Type:</span>
            <span className="font-medium">{badge.guestType}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Registration ID:</span>
            <span className="font-mono">{badge.registrationId}</span>
            <span className="ml-4 text-gray-500">QR:</span>
            <span className="font-mono">{badge.qrCode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Email:</span>
            <span>{badge.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>Zone <b>{badge.zone}</b>, Section <b>{badge.section}</b>, Tray <b>{badge.tray}</b></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Notes:</span>
            <span>{badge.notes || <span className="italic text-gray-400">None</span>}</span>
          </div>
        </div>
        {/* Right: Status & Actions */}
        <div className="flex flex-col gap-4 min-w-[220px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Print Status:</span>
            {getStatusIcon(badge.status)}
            <span className="font-medium capitalize">{badge.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Collected:</span>
            {badge.collected ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button
              className={`w-full flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition ${badge.collected ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={badge.collected}
              onClick={() => onAction('mark-collected')}
            >
              <CheckCircle className="w-4 h-4" /> Mark as Collected
            </button>
            <button
              className={`w-full flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canEdit}
              onClick={() => onAction('reprint')}
            >
              <Printer className="w-4 h-4" /> Request Reprint
            </button>
            <button
              className={`w-full flex items-center gap-2 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canEdit}
              onClick={() => onAction('update-location')}
            >
              <Edit2 className="w-4 h-4" /> Update Location
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function TrayLayoutView({ badges }: { badges: BadgeData[] }) {
  // Flatten all trays with their zone, section, and tray info
  const trayList: Array<{
    zone: string;
    section: string;
    tray: string;
    badges: BadgeData[];
  }> = [];

  // Group badges by zone, section, tray
  const grouped = badges.reduce((acc, badge) => {
    acc[badge.zone] = acc[badge.zone] || {};
    acc[badge.zone][badge.section] = acc[badge.zone][badge.section] || {};
    acc[badge.zone][badge.section][badge.tray] = acc[badge.zone][badge.section][badge.tray] || [];
    acc[badge.zone][badge.section][badge.tray].push(badge);
    return acc;
  }, {} as Record<string, Record<string, Record<string, BadgeData[]>>>);

  // Flatten to trayList
  Object.entries(grouped).forEach(([zone, sections]) => {
    Object.entries(sections).forEach(([section, trays]) => {
      Object.entries(trays).forEach(([tray, trayBadges]) => {
        trayList.push({ zone, section, tray, badges: trayBadges });
      });
    });
  });

  return (
    <DashboardCard title="Tray Layout" icon={<Box className="w-6 h-6 text-blue-500" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trayList.map(({ zone, section, tray, badges }) => (
          <div key={`${zone}-${section}-${tray}`} className="bg-blue-50 rounded-lg p-4 shadow-inner">
            <div className="font-bold text-blue-800 mb-2">
              Zone {zone} &middot; Section {section} <br /> Tray {tray}
            </div>
            <ul className="space-y-1">
              {badges.map((badge) => (
                <li key={badge.badgeId} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{badge.name}</span>
                  <span className="text-xs text-gray-500">({badge.badgeType})</span>
                  {badge.collected ? <CheckCircle className="w-4 h-4 text-green-600" title="Collected" /> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

function ActionControls({ badge, user, onAction }: { badge: BadgeData, user: any, onAction: (action: string) => void }) {
  // ... mark as collected, reprint, update location (admin/supervisor only) ...
  return <div>TODO: ActionControls</div>;
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
  // Simulated badge data for demo
  const [data, setData] = useState<BadgeData[]>([
    {
      name: 'John Doe', badgeId: '12345', registrationId: 'REG-001', qrCode: 'QR12345', badgeType: 'VIP', guestType: 'VIP', zone: 'A', section: '1', tray: 'A1', organization: 'Tech Corp', email: 'john.doe@example.com', notes: 'Speaker', status: 'pre-printed', collected: false, printHistory: [
        { status: 'pre-printed', timestamp: '2024-07-20 09:00', staff: 'Admin', note: 'Initial print' }
      ]
    },
    {
      name: 'Jane Smith', badgeId: '12346', registrationId: 'REG-002', qrCode: 'QR12346', badgeType: 'Attendee', guestType: 'Attendee', zone: 'B', section: '2', tray: 'B2', organization: 'Biz Group', email: 'jane.smith@biz.com', notes: '', status: 'not printed', collected: false, printHistory: []
    },
    {
      name: 'Alice Lee', badgeId: '12347', registrationId: 'REG-003', qrCode: 'QR12347', badgeType: 'Speaker', guestType: 'Speaker', zone: 'C', section: '3', tray: 'C3', organization: 'Alpha Inc', email: 'alice.lee@alpha.com', notes: '', status: 'reprint requested', collected: false, printHistory: [
        { status: 'not printed', timestamp: '2024-07-20 08:00', staff: 'Admin' },
        { status: 'reprint requested', timestamp: '2024-07-20 10:00', staff: 'Supervisor', note: 'Badge damaged' }
      ]
    }
  ]);
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
    switch (type) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800'
      case 'Speaker':
        return 'bg-blue-100 text-blue-800'
      case 'Staff':
        return 'bg-green-100 text-green-800'
      case 'Visitor':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // CSV upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          // Map/validate fields to BadgeData
          const parsed = (result.data as any[]).map((row) => ({
            name: row.name || '',
            badgeId: row.badgeId || '',
            registrationId: row.registrationId || '',
            qrCode: row.qrCode || '',
            badgeType: row.badgeType || '',
            guestType: row.guestType || '',
            zone: row.zone || '',
            section: row.section || '',
            tray: row.tray || '',
            organization: row.organization || '',
            email: row.email || '',
            notes: row.notes || '',
            status: (row.status as any) || 'not printed',
            collected: row.collected === 'true' || false,
            printHistory: [],
          }));
          setData(parsed);
          setSelectedGuest(null);
        },
        error: (error) => {
          alert('Error parsing CSV: ' + error.message);
        },
      });
    }
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
        guestType: 'VIP',
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
        guestType: 'Attendee',
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

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Action handler for badge actions
  const handleBadgeAction = (action: string) => {
    if (action === 'mark-collected' && selectedGuest) {
      // Update the badge in data
      setData(prevData => prevData.map(badge =>
        badge.badgeId === selectedGuest.badgeId
          ? { ...badge, collected: true }
          : badge
      ));
      // Also update selectedGuest to reflect the change
      setSelectedGuest(prev => prev ? { ...prev, collected: true } : prev);
      toast.success(`Marked ${selectedGuest.name} as collected.`);
    } else {
      alert(`Action: ${action} for ${selectedGuest?.name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning for missing backend API */}
      <div className="text-xs text-yellow-600 mb-2">
        Badge lookup is only available via CSV upload. Real-time badge search
        requires backend API support.
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locate Badges</h1>
          <p className="text-gray-600 mt-1">Search and manage guest badges by name, QR code, registration ID, or company.</p>
        </div>
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-2">
          <SearchBarWithAutocomplete badges={data} onSelect={setSelectedGuest} />
          {user?.role === 'organizer' && (
            <div className="flex gap-2 mt-2">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200"
                onClick={downloadSampleCsv}
              >
                <Download className="w-4 h-4" /> Download Sample CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" /> Upload CSV
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      </div>
      {selectedGuest && (
        <>
          <BadgeResultPanel badge={selectedGuest} user={user} onAction={handleBadgeAction} />
          <HistoryLog history={selectedGuest.printHistory} />
        </>
      )}
      <TrayLayoutView badges={data} />
    </div>
  )
}
