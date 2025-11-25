import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getShortLinks, deleteShortLink, getMyEvents } from '@/lib/api'
import { ModernDeleteConfirmationDialog } from '@/components/ui/ModernConfirmationDialog'
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
  XCircle,
  Link2
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<{ id: number; shortCode: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      
      const response = await getShortLinks(params)
      
      // Handle different response formats
      let links = []
      if (response.data.data) {
        // Paginated response
        links = response.data.data
      } else if (Array.isArray(response.data)) {
        // Direct array response
        links = response.data
      }
      
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

  const handleDeleteClick = (id: number, shortCode: string) => {
    setLinkToDelete({ id, shortCode })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteShortLink(linkToDelete.id)
      toast.success('Registration link deleted successfully', {
        description: `The link "${linkToDelete.shortCode}" has been permanently removed.`,
      })
      await loadShortLinks()
      setDeleteDialogOpen(false)
      setLinkToDelete(null)
    } catch (error) {
      console.error('Error deleting short link:', error)
      toast.error('Failed to delete registration link', {
        description: 'An error occurred while deleting the link. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyLink = (url: string, shortCode: string) => {
    // Match the public registration link format: use window.location.origin
    const fullUrl = `${window.location.origin}/r/${shortCode}`
    navigator.clipboard.writeText(fullUrl)
    toast.success('Link copied to clipboard!', {
      description: `The registration link has been copied.`,
    })
  }

  const getStatusBadge = (link: ShortLink) => {
    if (link.expires_at && new Date(link.expires_at) <= new Date()) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/30">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      )
    }
    return (
      <Badge className="bg-success/10 text-success border-success/30">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    )
  }

  const getUsageBadge = (count: number) => {
    if (count === 0) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Users className="w-3 h-3 mr-1" />
          No usage
        </Badge>
      )
    } else if (count < 5) {
      return (
        <Badge variant="outline" className="text-info border-info/30">
          <Users className="w-3 h-3 mr-1" />
          {count} clicks
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-success border-success/30">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" variant="primary" text="Loading registration links..." />
          <div className="text-sm text-muted-foreground/70 mt-2">Gathering link data and statistics</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Usher Management', href: '/dashboard/usher-management' },
            { label: 'Registration Links', href: '/dashboard/usher-management/links' }
          ]}
          className="mb-4"
        />
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Registration Link Management
              </h1>
              <p className="text-muted-foreground">
                Manage and track your usher registration short links
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Link to="/dashboard/usher-management/register">
              <Button className="bg-brand-gradient shadow-lg hover:shadow-xl text-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Generate New Link
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-info" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-card-foreground">{totalLinks}</div>
                <div className="text-sm text-muted-foreground">Total Links</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">All registration links created</p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-card-foreground">{activeLinks}</div>
                <div className="text-sm text-muted-foreground">Active Links</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Currently valid and usable</p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-card-foreground">{totalUsage}</div>
                <div className="text-sm text-muted-foreground">Total Usage</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total clicks across all links</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Search & Filters</h3>
              <p className="text-sm text-muted-foreground">Find and filter registration links</p>
            </div>
            <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-info" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-foreground mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by event name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border focus:bg-card"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Event</Label>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
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
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-background border-border focus:bg-card">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Links Table */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Registration Links</h3>
              <p className="text-sm text-muted-foreground">
                {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {filteredLinks.length > 0 && (
              <Badge variant="outline" className="text-sm">
                <Clock className="w-3 h-3 mr-1" />
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
            )}
          </div>
          
          {filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">No links found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || (filterEvent && filterEvent !== 'all') || (filterStatus && filterStatus !== 'all')
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first registration link to get started.'
                }
              </p>
              {!searchTerm && (!filterEvent || filterEvent === 'all') && (!filterStatus || filterStatus === 'all') && (
                <Link to="/dashboard/usher-management/register">
                  <Button className="bg-brand-gradient shadow-sm text-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate First Link
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold text-foreground text-sm py-4">Event</TableHead>
                    <TableHead className="font-semibold text-foreground text-sm py-4">Short Code</TableHead>
                    <TableHead className="font-semibold text-foreground text-sm py-4">Status</TableHead>
                    <TableHead className="font-semibold text-foreground text-sm py-4">Usage</TableHead>
                    <TableHead className="font-semibold text-foreground text-sm py-4">Created</TableHead>
                    <TableHead className="font-semibold text-foreground text-sm py-4">Expires</TableHead>
                    <TableHead className="font-semibold text-foreground text-sm py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id} className="hover:bg-accent transition-colors border-b border-border">
                      <TableCell className="py-4">
                        <div>
                          <div className="font-semibold text-foreground">{link.event.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {link.event.start_date ? format(parseISO(link.event.start_date), 'MMM dd, yyyy') : 'No date'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-mono text-sm bg-muted px-3 py-1.5 rounded-lg border border-border inline-block">
                          {link.short_code}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(link)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getUsageBadge(link.usage_count)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {link.created_at ? format(parseISO(link.created_at), 'MMM dd, yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {link.expires_at ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <AlertCircle className="w-3 h-3" />
                            {format(parseISO(link.expires_at), 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/70">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(link.short_url, link.short_code)}
                            className="hover:bg-accent"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-accent"
                          >
                            <a href={`${window.location.origin}/r/${link.short_code}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Preview
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(link.id, link.short_code)}
                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Back to Usher Management */}
        <div className="mt-6">
          <Link to="/dashboard/usher-management">
            <Button variant="outline" className="flex items-center gap-2 shadow-sm">
              ← Back to Usher Management
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {linkToDelete && (
        <ModernDeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setLinkToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
          itemName={linkToDelete.shortCode}
          itemType="registration link"
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
