import { useState, useEffect } from 'react'
import { Search, Mail, MessageSquare, Plus, Eye, Edit, Copy, Trash2, Filter, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { toast } from 'sonner'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { ProtectedButton } from '@/components/ProtectedButton'

interface Template {
  id: number
  name: string
  type: 'email' | 'sms' | 'both'
  subject?: string
  preview_text?: string
  created_at: string
}

interface Segment {
  id: number
  name: string
  criteria: any
  recipient_count?: number
  created_at: string
}

export function LibraryView({ onNewTemplate, onNewSegment }: { onNewTemplate: () => void; onNewSegment: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const { checkPermission } = usePermissionCheck()

  useEffect(() => {
    fetchData()
  }, [typeFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch templates
      const templatesRes = await api.get('/marketing/templates')
      const templatesData = templatesRes.data.data || templatesRes.data
      setTemplates(Array.isArray(templatesData) ? templatesData : [])

      // Fetch segments
      const segmentsRes = await api.get('/marketing/segments')
      const segmentsData = segmentsRes.data.data || segmentsRes.data
      setSegments(Array.isArray(segmentsData) ? segmentsData : [])
    } catch (error) {
      console.error('Error fetching library data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    return true
  })

  const filteredSegments = segments.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Content Library
          </h2>
          <p className="text-gray-600">Manage templates and audience segments</p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">
            <Mail className="w-4 h-4 mr-2" />
            Templates
            <Badge variant="secondary" className="ml-2">{templates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="segments">
            <MessageSquare className="w-4 h-4 mr-2" />
            Segments
            <Badge variant="secondary" className="ml-2">{segments.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Templates Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ProtectedButton
              permission="marketing.templates"
              onClick={() => {
                if (checkPermission('marketing.templates', 'create templates')) {
                  onNewTemplate();
                }
              }}
              actionName="create templates"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </ProtectedButton>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {template.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                        {template.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-600" />}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="mt-2 capitalize">
                        {template.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      Subject: {template.subject}
                    </p>
                  )}
                  {template.preview_text && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {template.preview_text}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="w-3 h-3 mr-1" />
                      Duplicate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">Create your first template to get started</p>
                <ProtectedButton
                  permission="marketing.templates"
                  onClick={() => {
                    if (checkPermission('marketing.templates', 'create templates')) {
                      onNewTemplate();
                    }
                  }}
                  actionName="create templates"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </ProtectedButton>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {/* Segments Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search segments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ProtectedButton
              permission="marketing.segments"
              onClick={() => {
                if (checkPermission('marketing.segments', 'create segments')) {
                  onNewSegment();
                }
              }}
              actionName="create segments"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Segment
            </ProtectedButton>
          </div>

          {/* Segments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSegments.map((segment) => (
              <Card key={segment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Audience Size</span>
                    <Badge>{(segment.recipient_count || 0).toLocaleString()} members</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View Members
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSegments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No segments found</h3>
                <p className="text-gray-600 mb-4">Create your first audience segment</p>
                <ProtectedButton
                  permission="marketing.segments"
                  onClick={() => {
                    if (checkPermission('marketing.segments', 'create segments')) {
                      onNewSegment();
                    }
                  }}
                  actionName="create segments"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Segment
                </ProtectedButton>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
