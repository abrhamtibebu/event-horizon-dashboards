import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getShortLinks, deleteShortLink, getMyEvents } from '@/lib/api'
import { 
  Copy, 
  ExternalLink, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  Clock,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Link as LinkIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface ShortLink {
  id: number
  short_code: string
  short_url: string
  event: {
    id: number
    name: string
    start_date: string
  }
  registration_data: any
  expires_at: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

interface Event {
  id: number
  name: string
  start_date: string
}

export default function ShortLinkManagement() {
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [filterEvent, filterStatus])

  // Refresh data when component mounts (e.g., when navigating from generation page)
  useEffect(() => {
    const handleFocus = () => {
      loadShortLinks()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    await Promise.all([loadShortLinks(), loadEvents()])
  }

  const loadShortLinks = async () => {
    try {
      const params: any = {}
      if (filterEvent && filterEvent !== 'all') params.event_id = filterEvent
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus
      
      console.log('Loading short links with params:', params)
      const response = await getShortLinks(params)
      console.log('Short links response:', response.data)
      
      // Handle different response formats
      let links = []
      if (response.data.data) {
        // Paginated response
        links = response.data.data
      } else if (Array.isArray(response.data)) {
        // Direct array response
        links = response.data
      }
      
      console.log('Processed links:', links)
      setShortLinks(links)
    } catch (error) {
      console.error('Error loading short links:', error)
      toast.error('Failed to load short links')
    }
  }

  const loadEvents = async () => {
    try {
      const response = await getMyEvents('active,draft,completed')
      setEvents(response.data || [])
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadShortLinks()
      toast.success('Links refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh links')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: number, shortCode: string) => {
    if (!confirm(`Are you sure you want to delete the link "${shortCode}"? This action cannot be undone.`)) return
    
    try {
      await deleteShortLink(id)
      toast.success('Short link deleted successfully')
      await loadShortLinks()
    } catch (error) {
      console.error('Error deleting short link:', error)
      toast.error('Failed to delete short link')
    }
  }

  const handleCopyLink = (url: string, shortCode: string) => {
    navigator.clipboard.writeText(url)
    toast.success(`Link "${shortCode}" copied to clipboard!`)
  }

  const getStatusBadge = (link: ShortLink) => {
    if (link.expires_at && new Date(link.expires_at) <= new Date()) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expired
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
        <CheckCircle className="w-3 h-3" />
        Active
      </Badge>
    )
  }

  const getUsageBadge = (count: number) => {
    if (count === 0) {
      return (
        <Badge variant="outline" className="text-gray-500">
          <Users className="w-3 h-3 mr-1" />
          No usage
        </Badge>
      )
    } else if (count < 5) {
      return (
        <Badge variant="outline" className="text-blue-600">
          <Users className="w-3 h-3 mr-1" />
          {count} clicks
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-green-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          {count} clicks
        </Badge>
      )
    }
  }

  const filteredLinks = shortLinks.filter(link => {
    if (searchTerm) {
      return link.event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             link.short_code.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  const totalLinks = shortLinks.length
  const activeLinks = shortLinks.filter(link => !link.expires_at || new Date(link.expires_at) > new Date()).length
  const totalUsage = shortLinks.reduce((sum, link) => sum + link.usage_count, 0)

  console.log('Short links state:', shortLinks)
  console.log('Filtered links:', filteredLinks)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Registration Link Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track your usher registration short links
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Link to="/dashboard/usher-management/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Generate New Link
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-2xl font-bold text-gray-900">{totalLinks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Links</p>
                <p className="text-2xl font-bold text-green-600">{activeLinks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">{totalUsage}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by event or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Links Table */}
        <Card className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Registration Links</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {filteredLinks.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  Last updated: {new Date().toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading short links...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No links found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || (filterEvent && filterEvent !== 'all') || (filterStatus && filterStatus !== 'all')
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first registration link to get started.'
                }
              </p>
              {!searchTerm && (!filterEvent || filterEvent === 'all') && (!filterStatus || filterStatus === 'all') && (
                <Link to="/dashboard/usher-management/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate First Link
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{link.event.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(link.event.start_date).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg border">
                          {link.short_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(link)}
                      </TableCell>
                      <TableCell>
                        {getUsageBadge(link.usage_count)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          {new Date(link.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {link.expires_at ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <AlertCircle className="w-3 h-3" />
                            {new Date(link.expires_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(link.short_url, link.short_code)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-green-50 hover:text-green-600"
                          >
                            <a href={link.short_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(link.id, link.short_code)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Back to Usher Management */}
        <div className="mt-6">
          <Link to="/dashboard/usher-management">
            <Button variant="outline" className="flex items-center gap-2">
              ← Back to Usher Management
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}