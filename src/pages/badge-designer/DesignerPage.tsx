import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Save, 
  Eye,
  Download,
} from 'lucide-react'
import { BadgeCanvas } from '@/components/badge-designer/BadgeCanvas'
import { Toolbar } from '@/components/badge-designer/Toolbar'
import { Sidebar } from '@/components/badge-designer/Sidebar'
import { PropertiesPanel } from '@/components/badge-designer/PropertiesPanel'
import { PreviewModal } from '@/components/badge-designer/PreviewModal'
import { useBadgeStore, startAutoSave, stopAutoSave } from '@/lib/badge-designer/store/useBadgeStore'
import { 
  useSaveBadgeTemplate, 
  useUpdateBadgeTemplate,
  useBadgeTemplate,
  useEvent,
  useSampleAttendee,
} from '@/hooks/badge-designer/useBadgeTemplates'
import { loadGoogleFonts } from '@/lib/badge-designer/utils/fontLoader'
import { toast } from 'sonner'

export function DesignerPage() {
  const { eventId, templateId } = useParams()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('My Badge Template')
  const [isDefault, setIsDefault] = useState(true)
  
  const { exportTemplate, importTemplate } = useBadgeStore()
  const saveMutation = useSaveBadgeTemplate(Number(eventId))
  const updateMutation = useUpdateBadgeTemplate(Number(eventId))
  
  // Load existing template if editing
  const { data: templateData } = useBadgeTemplate(
    Number(eventId), 
    templateId && templateId !== 'new' ? Number(templateId) : 0
  )
  
  // Load event and sample attendee data
  const { data: eventData } = useEvent(Number(eventId))
  const { data: attendeeData } = useSampleAttendee(Number(eventId))
  
  // Load template data into store when editing
  useEffect(() => {
    if (templateData && templateId && templateId !== 'new') {
      console.log('Loading template into store:', templateData)
      
      // Set template name and default status
      if (templateData.name) {
        setTemplateName(templateData.name)
      }
      if (templateData.is_default !== undefined) {
        setIsDefault(templateData.is_default)
      }
      
      // Import template JSON into store
      if (templateData.template_json) {
        importTemplate(templateData.template_json)
        toast.success(`Loaded template: ${templateData.name}`)
      }
    }
  }, [templateData, templateId])
  
  // Load Google Fonts on mount
  useEffect(() => {
    loadGoogleFonts().then(() => {
      console.log('Badge designer fonts loaded')
    })
    
    // Start autosave
    startAutoSave()
    
    return () => {
      stopAutoSave()
    }
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          useBadgeStore.getState().undo()
        } else if (e.key === 'y' || (e.shiftKey && e.key === 'z')) {
          e.preventDefault()
          useBadgeStore.getState().redo()
        } else if (e.key === 's') {
          e.preventDefault()
          setShowSaveDialog(true)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  const handleSave = async () => {
    const templateData = exportTemplate()
    
    try {
      if (templateId && templateId !== 'new') {
        // Update existing template
        await updateMutation.mutateAsync({
          templateId: Number(templateId),
          data: {
            name: templateName,
            template_json: templateData,
            is_default: isDefault,
          },
        })
        toast.success('Template updated successfully')
      } else {
        // Create new template
        const result = await saveMutation.mutateAsync({
          name: templateName,
          template_json: templateData,
          is_default: isDefault,
        })
        toast.success('Template created successfully')
        // Navigate to the newly created template
        if (result?.data?.id) {
          navigate(`/badge-designer/designer/${eventId}/${result.data.id}`)
        }
      }
      setShowSaveDialog(false)
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error('Failed to save template')
    }
  }
  
  const sampleData = {
    attendee: attendeeData?.data?.[0]?.guest || {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Tech Corp',
      jobtitle: 'Software Engineer',
      phone: '+251 911 234 567',
      uuid: 'sample-uuid-123',
    },
    event: eventData || {
      name: 'Sample Event',
      date: new Date().toISOString().split('T')[0],
      location: 'Addis Ababa',
    },
    guest_type: {
      name: 'VIP',
    },
  }
  
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="h-16 border-b flex items-center justify-between px-4 bg-white z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/badge-designer/templates/${eventId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Badge Designer</h1>
            <p className="text-xs text-muted-foreground">
              {eventData?.name || 'Loading event...'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowPreview(true)} 
            variant="outline"
            className="hidden sm:flex"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Preview</span>
          </Button>
          <Button onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Save Template</span>
          </Button>
        </div>
      </div>
      
      {/* Main Layout: Sidebar | Canvas | Toolbar+Properties */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - collapsible on mobile */}
        <div className="lg:border-r bg-white">
          <Sidebar />
        </div>
        
        {/* Canvas - full width on mobile */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 lg:p-8 overflow-auto">
          <BadgeCanvas />
        </div>
        
        {/* Toolbar + Properties - stack below on mobile */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col bg-white overflow-hidden">
          <Toolbar />
          <div className="flex-1 border-t overflow-auto">
            <PropertiesPanel />
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sampleData={sampleData}
      />
      
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Badge Template</DialogTitle>
            <DialogDescription>
              Save this badge design as a template for the event
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label 
                htmlFor="is-default"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Set as default badge template for this event
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {isDefault 
                ? '✓ This template will be used when generating badges for this event' 
                : 'This template will be saved but not used by default'}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4" />
              <span className="ml-2">
                {templateId && templateId !== 'new' ? 'Update' : 'Save'} Template
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


