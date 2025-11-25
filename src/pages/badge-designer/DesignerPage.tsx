import { useState, useEffect, Suspense, lazy } from 'react'
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
  Settings,
  Layers,
  Palette,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { cn } from '@/lib/utils'

// Lazy load heavy components
const BadgeCanvas = lazy(() => import('@/components/badge-designer/BadgeCanvas').then(m => ({ default: m.BadgeCanvas })))
const Toolbar = lazy(() => import('@/components/badge-designer/Toolbar').then(m => ({ default: m.Toolbar })))
const Sidebar = lazy(() => import('@/components/badge-designer/Sidebar').then(m => ({ default: m.Sidebar })))
const PropertiesPanel = lazy(() => import('@/components/badge-designer/PropertiesPanel').then(m => ({ default: m.PropertiesPanel })))
const PreviewModal = lazy(() => import('@/components/badge-designer/PreviewModal').then(m => ({ default: m.PreviewModal })))

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center h-full">
    <Spinner size="md" text="Loading designer..." />
  </div>
)

export function DesignerPage() {
  const { eventId, templateId } = useParams()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('My Badge Template')
  const [isDefault, setIsDefault] = useState(true)
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  
  const { exportTemplate, loadTemplate, undo, redo, canUndo, canRedo, elements } = useBadgeStore()
  const saveMutation = useSaveBadgeTemplate(Number(eventId))
  const updateMutation = useUpdateBadgeTemplate(Number(eventId))
  const { checkPermission } = usePermissionCheck()
  
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
        loadTemplate(templateData.template_json)
        toast.success(`Loaded template: ${templateData.name}`)
      }
    }
  }, [templateData, templateId, loadTemplate])
  
  // Load Google Fonts on mount
  useEffect(() => {
    let mounted = true
    
    const loadFonts = async () => {
      try {
        await loadGoogleFonts()
        if (mounted) {
          setFontsLoaded(true)
          console.log('Badge designer fonts loaded')
        }
      } catch (error) {
        console.error('Failed to load fonts:', error)
        if (mounted) {
          setFontsLoaded(true) // Continue even if fonts fail
        }
      }
    }
    
    loadFonts()
    
    // Start autosave
    startAutoSave()
    
    return () => {
      mounted = false
      stopAutoSave()
    }
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if (e.key === 'y' || (e.shiftKey && e.key === 'z')) {
          e.preventDefault()
          redo()
        } else if (e.key === 's') {
          e.preventDefault()
          setShowSaveDialog(true)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
  
  const handleSave = async () => {
    if (!checkPermission('badges.design', 'save badge templates')) {
      return
    }
    
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
  
  // Show loading until fonts are loaded
  if (!fontsLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <Spinner size="md" text="Loading badge designer..." />
          <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      {/* Modern Top Bar */}
      <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/badge-designer/templates/${eventId}`)}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Badge Designer</h1>
              <p className="text-xs text-gray-500">
                {eventData?.name || 'Loading event...'}
                {templateId && templateId !== 'new' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Editing
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Top Bar Actions */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo()}
              className="h-8 w-8"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo()}
              className="h-8 w-8"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Panel Toggles */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="h-8 w-8"
            title={leftPanelOpen ? "Hide Layers" : "Show Layers"}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="h-8 w-8"
            title={rightPanelOpen ? "Hide Properties" : "Show Properties"}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Main Actions */}
          <Button 
            onClick={() => setShowPreview(true)} 
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button 
            onClick={() => setShowSaveDialog(true)}
            size="sm"
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers & Configuration */}
        {leftPanelOpen && (
          <div className={cn(
            "w-80 border-r border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-300",
            "flex flex-col overflow-hidden"
          )}>
            <Suspense fallback={<ComponentLoader />}>
              <Sidebar />
            </Suspense>
          </div>
        )}
        
        {/* Canvas Area - Center */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Canvas Toolbar */}
          <div className="h-12 border-b border-gray-200 bg-white/60 backdrop-blur-sm flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {elements.length} element{elements.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs text-gray-500">100%</span>
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <Suspense fallback={<ComponentLoader />}>
              <BadgeCanvas />
            </Suspense>
          </div>
        </div>
        
        {/* Right Sidebar - Tools & Properties */}
        {rightPanelOpen && (
          <div className={cn(
            "w-96 border-l border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-300",
            "flex flex-col overflow-hidden"
          )}>
            {/* Tools Section */}
            <div className="border-b border-gray-200">
              <Suspense fallback={<ComponentLoader />}>
                <Toolbar />
              </Suspense>
            </div>
            
            {/* Properties Section */}
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<ComponentLoader />}>
                <PropertiesPanel />
              </Suspense>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Modal */}
      <Suspense fallback={null}>
        <PreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          sampleData={sampleData}
        />
      </Suspense>
      
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Badge Template
            </DialogTitle>
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
                className="w-full"
              />
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox 
                id="is-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <Label 
                  htmlFor="is-default"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Set as default badge template
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isDefault 
                    ? '✓ This template will be used when generating badges for this event' 
                    : 'This template will be saved but not used by default'}
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {templateId && templateId !== 'new' ? 'Update' : 'Save'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
