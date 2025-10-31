import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Sparkles, Check, ArrowRight, Layout, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'

interface Template {
  id: number
  name: string
  description: string
  category: string
  type: 'email' | 'sms' | 'both'
  subject?: string
  email_body?: string
  sms_body?: string
  usage_count?: number
}

interface TemplateSelectorProps {
  selectedTemplate: Template | null
  onSelectTemplate: (template: Template | null) => void
  onNext: () => void
}

const TEMPLATE_CATEGORIES = [
  { id: 'welcome', name: 'Welcome', icon: Sparkles, color: 'purple' },
  { id: 'reminder', name: 'Reminder', icon: Mail, color: 'orange' },
  { id: 'promotional', name: 'Promotional', icon: Star, color: 'pink' },
  { id: 'thank_you', name: 'Thank You', icon: Check, color: 'green' },
  { id: 'custom', name: 'Custom', icon: Layout, color: 'blue' },
]

export function TemplateSelector({ selectedTemplate, onSelectTemplate, onNext }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/marketing/templates')
      const data = response.data.data || response.data
      setTemplates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'custom'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="w-4 h-4" />
    if (type === 'sms') return <MessageSquare className="w-4 h-4" />
    return <Sparkles className="w-4 h-4" />
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      welcome: 'bg-purple-100 text-purple-800 border-purple-200',
      reminder: 'bg-orange-100 text-orange-800 border-orange-200',
      promotional: 'bg-pink-100 text-pink-800 border-pink-200',
      thank_you: 'bg-green-100 text-green-800 border-green-200',
      custom: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

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
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
        <p className="text-gray-600 mt-2">Start with a pre-designed template or create from scratch</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
          >
            All
          </Button>
          {TEMPLATE_CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
              >
                <Icon className="w-4 h-4 mr-2" />
                {cat.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* "Start from Scratch" Option */}
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md border-2 ${
          selectedTemplate === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onSelectTemplate(null)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Layout className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Start from Scratch</h4>
                <p className="text-sm text-gray-600">Create a custom campaign without a template</p>
              </div>
            </div>
            {selectedTemplate === null && (
              <div className="p-2 bg-blue-500 rounded-full">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => 
          categoryTemplates.map(template => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedTemplate?.id === template.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.type)}
                    <Badge variant="outline" className={`${getCategoryColor(category)} border`}>
                      {template.category}
                    </Badge>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <div className="p-1 bg-blue-500 rounded-full">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description || 'No description'}
                </CardDescription>
              </CardHeader>
              {template.usage_count && (
                <CardContent>
                  <p className="text-xs text-gray-500">
                    Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Empty State */}
      {Object.keys(groupedTemplates).length === 0 && !selectedTemplate && (
        <Card>
          <CardContent className="p-12 text-center">
            <Layout className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold mb-2">No templates found</h4>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        <Button 
          onClick={onNext}
          disabled={!selectedTemplate && selectedTemplate !== null}
          size="lg"
          className="px-8"
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
