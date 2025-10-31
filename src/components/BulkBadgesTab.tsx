import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'
import { Download, FileText, Search, Plus, RefreshCw, X, CheckCircle2, Clock, XCircle, QrCode } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  bulkGenerateBadges,
  getPreGeneratedBadges,
  getPreGeneratedBadgeStats,
  unassignPreGeneratedBadge,
  exportPreGeneratedBadges,
} from '@/lib/api'
import { PreGeneratedBadge, BadgeStatistics, GuestType } from '@/types'
import { format } from 'date-fns'
import QRCode from 'qrcode'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface BulkBadgesTabProps {
  eventId: number
  guestTypes: GuestType[]
  eventName?: string
}

export function BulkBadgesTab({ eventId, guestTypes, eventName }: BulkBadgesTabProps) {
  const [badges, setBadges] = useState<PreGeneratedBadge[]>([])
  const [statistics, setStatistics] = useState<BadgeStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloadingQRs, setDownloadingQRs] = useState(false)
  
  // Filters
  const [selectedGuestType, setSelectedGuestType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selected badges for QR code export
  const [selectedBadges, setSelectedBadges] = useState<Set<number>>(new Set())
  
  // Generation dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generateGuestType, setGenerateGuestType] = useState<string>('')
  const [generateQuantity, setGenerateQuantity] = useState<string>('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const perPage = 15

  // Load badges
  const loadBadges = async () => {
    setLoading(true)
    try {
      const filters: any = {
        guest_type_id: selectedGuestType !== 'all' ? selectedGuestType : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        per_page: perPage,
      }
      
      const response = await getPreGeneratedBadges(eventId, filters)
      setBadges(response.data.data)
      setTotalPages(response.data.last_page)
      setTotalRecords(response.data.total)
    } catch (error: any) {
      toast.error('Failed to load badges: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await getPreGeneratedBadgeStats(eventId)
      setStatistics(response.data)
    } catch (error: any) {
      console.error('Failed to load statistics:', error)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadBadges()
    loadStatistics()
  }, [eventId, currentPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadBadges()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [selectedGuestType, selectedStatus, searchTerm])

  // Generate badges
  const handleGenerate = async () => {
    if (!generateGuestType || !generateQuantity) {
      toast.error('Please select guest type and enter quantity')
      return
    }

    const quantity = parseInt(generateQuantity)
    if (quantity < 1 || quantity > 1000) {
      toast.error('Quantity must be between 1 and 1000')
      return
    }

    setGenerating(true)
    try {
      await bulkGenerateBadges(eventId, {
        guest_type_id: parseInt(generateGuestType),
        quantity,
      })
      
      toast.success(`Successfully generated ${quantity} badges`)
      setGenerateDialogOpen(false)
      setGenerateGuestType('')
      setGenerateQuantity('')
      loadBadges()
      loadStatistics()
    } catch (error: any) {
      toast.error('Failed to generate badges: ' + (error.response?.data?.error || error.message))
    } finally {
      setGenerating(false)
    }
  }

  // Unassign badge
  const handleUnassign = async (badge: PreGeneratedBadge) => {
    if (!confirm(`Are you sure you want to unassign badge ${badge.badge_code}?`)) {
      return
    }

    try {
      await unassignPreGeneratedBadge(eventId, badge.id)
      toast.success('Badge unassigned successfully')
      loadBadges()
      loadStatistics()
    } catch (error: any) {
      toast.error('Failed to unassign badge: ' + (error.response?.data?.error || error.message))
    }
  }

  // Export badges
  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true)
    try {
      const guestTypeId = selectedGuestType !== 'all' ? parseInt(selectedGuestType) : undefined
      const response = await exportPreGeneratedBadges(eventId, format, guestTypeId)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `badge_assignments_${eventId}_${Date.now()}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success(`Badges exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      toast.error('Failed to export badges: ' + (error.response?.data?.error || error.message))
    } finally {
      setExporting(false)
    }
  }

  // Download QR codes as PNG with transparent background
  const handleDownloadQRCodes = async () => {
    if (selectedBadges.size === 0) {
      toast.error('Please select badges to download QR codes')
      return
    }

    setDownloadingQRs(true)
    try {
      // Get selected badge data
      const selectedBadgeData = badges.filter(badge => selectedBadges.has(badge.id))
      
      // Create a ZIP file with all QR codes
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      let processedCount = 0
      
      for (const badge of selectedBadgeData) {
        try {
          // Generate QR code with transparent background using qrcode library
          const canvas = document.createElement('canvas')
          await QRCode.toCanvas(canvas, badge.qr_code, {
            width: 512,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF00' // Transparent background
            },
            errorCorrectionLevel: 'M'
          })
          
          // Convert canvas to PNG blob with transparency
          const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to convert canvas to blob'))
              }
            }, 'image/png')
          })
          
          // Add to ZIP with descriptive filename
          const filename = `${badge.badge_code}_qr.png`
          zip.file(filename, pngBlob)
          
          processedCount++
        } catch (error) {
          console.error(`Failed to generate QR for ${badge.badge_code}:`, error)
          toast.error(`Failed to generate QR code for ${badge.badge_code}`)
        }
      }
      
      if (processedCount === 0) {
        toast.error('Failed to generate any QR codes')
        setDownloadingQRs(false)
        return
      }
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Create filename with event name
      const sanitizedEventName = eventName 
        ? eventName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)
        : `event_${eventId}`
      const filename = `badge_qr_codes_${sanitizedEventName}.zip`
      
      // Download the ZIP file
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Successfully downloaded ${processedCount} QR code(s) as PNG files with transparent backgrounds`)
    } catch (error: any) {
      console.error('Failed to download QR codes:', error)
      toast.error('Failed to download QR codes: ' + (error.message || 'Unknown error'))
    } finally {
      setDownloadingQRs(false)
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'void':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4" />
      case 'assigned':
        return <Clock className="h-4 w-4" />
      case 'void':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Badges</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statistics?.total || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Available</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {statistics?.available || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Assigned</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {statistics?.assigned || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Void</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {statistics?.void || 0}
          </div>
        </div>
      </div>

      {/* Generation Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generate Badges</h3>
          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Badges
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Bulk Badges</DialogTitle>
                <DialogDescription>
                  Generate a batch of pre-generated badges for a specific guest type.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Guest Type</Label>
                  <Select value={generateGuestType} onValueChange={setGenerateGuestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select guest type" />
                    </SelectTrigger>
                    <SelectContent>
                      {guestTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity (1-1000)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={generateQuantity}
                    onChange={(e) => setGenerateQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search badges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedGuestType} onValueChange={setSelectedGuestType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Guest Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Guest Types</SelectItem>
                {guestTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedGuestType('all')
                setSelectedStatus('all')
                setSearchTerm('')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadQRCodes}
            disabled={downloadingQRs || selectedBadges.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {downloadingQRs ? 'Generating...' : `Generate & Export QR Codes (${selectedBadges.size})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Badges Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={selectedBadges.size === badges.length && badges.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBadges(new Set(badges.map(b => b.id)))
                      } else {
                        setSelectedBadges(new Set())
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Badge Code</TableHead>
                <TableHead>Guest Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : badges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No badges found. Generate badges to get started.
                  </TableCell>
                </TableRow>
              ) : (
                badges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBadges.has(badge.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedBadges)
                          if (checked) {
                            newSelected.add(badge.id)
                          } else {
                            newSelected.delete(badge.id)
                          }
                          setSelectedBadges(newSelected)
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{badge.badge_code}</TableCell>
                    <TableCell>{badge.guest_type?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(badge.status)}>
                        {getStatusIcon(badge.status)}
                        <span className="ml-1 capitalize">{badge.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {badge.assigned_to_guest?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {badge.assigned_at ? format(new Date(badge.assigned_at), 'MMM d, yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {badge.status === 'assigned' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(badge)}
                        >
                          Unassign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {badges.length} of {totalRecords} badges
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-4">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
