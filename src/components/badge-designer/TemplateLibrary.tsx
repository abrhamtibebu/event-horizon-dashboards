import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Grid, List, Image as ImageIcon } from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  template: any
  tags: string[]
}

// Sample templates - in production, these would come from an API
const SAMPLE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Classic Badge',
    description: 'Simple and professional badge design',
    category: 'Professional',
    tags: ['classic', 'professional', 'simple'],
    template: {
      version: '2.1',
      objects: [
        {
          id: 'text-1',
          type: 'text',
          properties: {
            content: 'Name',
            fontSize: 32,
            fontFamily: 'Arial',
            fill: '#000000',
            left: 200,
            top: 100,
            width: 200,
            textAlign: 'center',
          },
        },
        {
          id: 'text-2',
          type: 'text',
          properties: {
            content: 'Company',
            fontSize: 18,
            fontFamily: 'Arial',
            fill: '#666666',
            left: 200,
            top: 150,
            width: 200,
            textAlign: 'center',
          },
        },
      ],
    },
  },
  {
    id: '2',
    name: 'Modern Badge',
    description: 'Contemporary design with QR code',
    category: 'Modern',
    tags: ['modern', 'qr', 'contemporary'],
    template: {
      version: '2.1',
      objects: [
        {
          id: 'text-1',
          type: 'text',
          properties: {
            content: 'Name',
            fontSize: 28,
            fontFamily: 'Roboto',
            fill: '#000000',
            left: 200,
            top: 80,
            width: 200,
            textAlign: 'center',
          },
        },
        {
          id: 'qr-1',
          type: 'qr',
          properties: {
            qrData: '{attendee.uuid}',
            size: 120,
            left: 240,
            top: 200,
          },
        },
      ],
    },
  },
]

export function TemplateLibrary() {
  const { loadTemplate } = useBadgeStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const categories = ['all', ...new Set(SAMPLE_TEMPLATES.map(t => t.category))]
  
  const filteredTemplates = SAMPLE_TEMPLATES.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  const handleApplyTemplate = (template: Template) => {
    loadTemplate(template.template)
    toast.success(`Applied template: ${template.name}`)
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Template Library</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category}
          </Button>
        ))}
      </div>
      
      {/* Templates */}
      <ScrollArea className="h-[400px]">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleApplyTemplate(template)}
              >
                <CardHeader>
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center mb-2">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleApplyTemplate(template)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="flex gap-1 mt-2">
                      {template.tags.map(tag => (
                        <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm">Apply</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No templates found matching your search.</p>
        </div>
      )}
    </div>
  )
}





