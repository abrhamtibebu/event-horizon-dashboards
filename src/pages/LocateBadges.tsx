import { useState, useRef } from 'react'
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
  // ... implement search bar with auto-complete for name, QR, reg ID, company ...
  return <div>TODO: SearchBarWithAutocomplete</div>;
}

function BadgeResultPanel({ badge, user, onAction }: { badge: BadgeData, user: any, onAction: (action: string) => void }) {
  // ... show badge details, print status, tray, action buttons ...
  return <div>TODO: BadgeResultPanel</div>;
}

function TrayLayoutView({ badges }: { badges: BadgeData[] }) {
  // ... optional visual tray layout or list view ...
  return <div>TODO: TrayLayoutView</div>;
}

function ActionControls({ badge, user, onAction }: { badge: BadgeData, user: any, onAction: (action: string) => void }) {
  // ... mark as collected, reprint, update location (admin/supervisor only) ...
  return <div>TODO: ActionControls</div>;
}

function HistoryLog({ history }: { history: BadgeData['printHistory'] }) {
  // ... show print status changes and staff notes ...
  return <div>TODO: HistoryLog</div>;
}

export default function LocateBadges() {
  const { user } = useAuth();
  const [data, setData] = useState<BadgeData[]>([])
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setData(result.data as BadgeData[])
          toast.success('CSV file uploaded and parsed successfully!')
        },
        error: (error) => {
          toast.error('Error parsing CSV file:', error.message)
        },
      })
    }
  }

  const downloadSampleCsv = () => {
    const csv = Papa.unparse([
      {
        name: 'John Doe',
        badgeId: '12345',
        badgeType: 'VIP',
        zone: 'A',
        section: '1',
        tray: 'A1',
        organization: 'Tech Corp',
        email: 'john.doe@example.com',
        notes: 'Speaker',
      },
    ])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'sample_badges.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      {/* Warning for missing backend API */}
      <div className="text-xs text-yellow-600 mb-2">
        Badge lookup is only available via CSV upload. Real-time badge search
        requires backend API support.
      </div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locate Badges</h1>
          <p className="text-gray-600 mt-1">
            Upload a CSV to find badge locations quickly
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadSampleCsv}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
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

      {selectedGuest && (
        <DashboardCard
          title="Badge Location Details"
          icon={<MapPin className="w-6 h-6 text-blue-600" />}
        >
          <div className="relative p-6 bg-blue-50 rounded-lg shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedGuest(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Guest Name</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedGuest.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Organization
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedGuest.organization}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Badge Type</p>
                <Badge className={getGuestTypeColor(selectedGuest.badgeType)}>
                  {selectedGuest.badgeType}
                </Badge>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Zone</p>
                <p className="text-3xl font-bold text-blue-700">
                  {selectedGuest.zone}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Section</p>
                <p className="text-3xl font-bold text-blue-700">
                  {selectedGuest.section}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tray</p>
                <p className="text-3xl font-bold text-blue-700">
                  {selectedGuest.tray}
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Search and Filter Section */}
      <DashboardCard title="Badge Location Management">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by any field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="A">Zone A</SelectItem>
                <SelectItem value="B">Zone B</SelectItem>
                <SelectItem value="C">Zone C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="located">Located</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Badges
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {data.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Located</p>
                  <p className="text-2xl font-bold text-green-900">
                    {data.filter((item) => item.status === 'located').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {data.filter((item) => item.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">
                    VIP Guests
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {data.filter((item) => item.guestType === 'VIP').length}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Badge Type</TableHead>
                  <TableHead>Guest Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, index) => (
                  <TableRow
                    key={index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedGuest(row)}
                  >
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.organization}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Badge className={getGuestTypeColor(row.badgeType)}>
                        {row.badgeType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGuestTypeColor(row.guestType || row.badgeType)}>
                        {row.guestType || row.badgeType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      Zone {row.zone}, Section {row.section}, Tray {row.tray}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor('located')}>
                        Located
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DashboardCard>
    </div>
  )
}
