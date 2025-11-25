import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'
import { useBadgeTemplates, useDeleteBadgeTemplate } from '@/hooks/badge-designer/useBadgeTemplates'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { ProtectedButton } from '@/components/ProtectedButton'
import { format } from 'date-fns'

export function TemplateListPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { data: templates, isLoading } = useBadgeTemplates(Number(eventId))
  const deleteMutation = useDeleteBadgeTemplate(Number(eventId))
  const { checkPermission } = usePermissionCheck()
  
  // Debug: Log templates data
  console.log('Templates raw data:', templates)
  console.log('Templates structure check:', {
    hasData: !!templates,
    isArray: Array.isArray(templates),
    hasDataProp: !!templates?.data,
    isDataArray: Array.isArray(templates?.data),
    length: templates?.data?.length || templates?.length || 0
  })
  
  // Handle different response structures
  const templatesList = Array.isArray(templates) 
    ? templates 
    : Array.isArray(templates?.data) 
      ? templates.data 
      : []
  
  console.log('Final templates list:', templatesList)
  
  // Debug: Log each template's content
  templatesList.forEach((t: any, i: number) => {
    console.log(`Template ${i + 1} [ID: ${t.id}]:`, {
      name: t.name,
      isDefault: t.is_default,
      hasJSON: !!t.template_json,
      elements: t.template_json?.elements?.length || 0,
      canvasSize: t.template_json?.canvasSize,
      createdAt: t.created_at
    })
  })
  
  const handleDelete = async (templateId: number) => {
    if (!checkPermission('badges.manage', 'delete badge templates')) {
      return
    }
    
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteMutation.mutateAsync(templateId)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Badge Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage badge designs for your event
            </p>
          </div>
          <ProtectedButton
            permission="badges.design"
            onClick={() => {
              if (checkPermission('badges.design', 'create badge templates')) {
                navigate(`/badge-designer/designer/${eventId}/new`)
              }
            }}
            size="lg"
            actionName="create badge templates"
          >
            <Plus className="h-5 w-5" />
            <span className="ml-2">Create New Template</span>
          </ProtectedButton>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templatesList.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first badge template to get started
              </p>
              <Button 
                onClick={() => navigate(`/badge-designer/designer/${eventId}/new`)}
              >
                <Plus className="h-5 w-5" />
                <span className="ml-2">Create Template</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templatesList.map((template: any) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{template.name}</span>
                    {template.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Template Preview (simplified) */}
                  <div className="bg-gray-100 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Template Preview</p>
                      <p className="text-xs mt-1">
                        {template.template_json?.elements?.length || 0} elements
                      </p>
                      {template.template_json?.canvasSize && (
                        <p className="text-xs mt-1">
                          {template.template_json.canvasSize.width} × {template.template_json.canvasSize.height}px
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Updated: {format(new Date(template.updated_at), 'MMM dd, yyyy')}
                    </p>
                    {template.template_json?.version && (
                      <p className="text-xs text-muted-foreground">
                        Version: {template.template_json.version}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <ProtectedButton
                      permission="badges.design"
                      onClick={() => {
                        if (checkPermission('badges.design', 'edit badge templates')) {
                          navigate(`/badge-designer/designer/${eventId}/${template.id}`)
                        }
                      }}
                      variant="default"
                      size="sm"
                      className="flex-1"
                      actionName="edit badge templates"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="ml-2">Edit</span>
                    </ProtectedButton>
                    
                    <ProtectedButton
                      permission="badges.manage"
                      onClick={() => handleDelete(template.id)}
                      variant="outline"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      actionName="delete badge templates"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ProtectedButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


