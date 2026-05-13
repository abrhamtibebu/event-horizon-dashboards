// Badge Design Page - Production-ready drag-and-drop badge designer
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  Palette,
  Loader2,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { BadgeCanvas, DesignerToolbar, PropertyPanel, LayersPanel } from '@/components/badge-designer';
import { useBadgeDesigner, createTextElement, createDynamicFieldElement, createImageElement, createQRCodeElement, createShapeElement } from '@/hooks/useBadgeDesigner';
import type { DynamicFieldKey, BadgeLayout, BadgeSizeKey } from '@/types/badge-designer';
import { DEFAULT_SAMPLE_DATA, BADGE_SIZES, COLOR_PRESETS } from '@/types/badge-designer';
import api from '@/lib/api';
import AssignToEventDialog from '@/components/badge-designer/AssignToEventDialog';
import { compressImage } from '@/lib/utils';

const BadgeDesignPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const {
    state,
    actions,
    activeElements,
    selectedElements,
    canUndo,
    canRedo,
    badgeSize,
  } = useBadgeDesigner();

  const activeSide = state.layout[state.activeSide];

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement)?.tagName
      );
      if (isInput) return;

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementIds.length > 0) {
        e.preventDefault();
        actions.deleteElements(state.selectedElementIds);
      }
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        actions.redo();
      }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (state.selectedElementIds.length > 0) {
          actions.duplicateElements(state.selectedElementIds);
        }
      }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        actions.selectElements(activeElements.map((el) => el.id));
      }
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') actions.setTool('select');
      // Escape
      if (e.key === 'Escape') actions.clearSelection();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElementIds, activeElements, actions]);

  // ── Element Insertion Handlers ─────────────────────────────────────────

  const handleAddText = useCallback(() => {
    actions.addElement(createTextElement());
  }, [actions]);

  const handleAddDynamicField = useCallback(
    (fieldKey: DynamicFieldKey) => {
      actions.addElement(createDynamicFieldElement(fieldKey));
    },
    [actions]
  );

  const handleAddImage = useCallback(() => {
    actions.addElement(createImageElement());
  }, [actions]);

  const handleAddQRCode = useCallback(() => {
    actions.addElement(createQRCodeElement());
  }, [actions]);

  const handleAddShape = useCallback(
    (shapeType: 'rectangle' | 'ellipse' | 'circle') => {
      actions.addElement(createShapeElement({ shapeType }));
    },
    [actions]
  );

  // ── Save / Load ───────────────────────────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    const data = {
      name: state.templateName,
      layout: state.layout,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.templateName.replace(/\s+/g, '_')}_badge_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Template exported!' });
  }, [state]);

  const handleSaveTemplate = useCallback(async () => {
    try {
      const templateJson = JSON.stringify(state.layout);

      if (eventId) {
        // Save to backend
        const payload = {
          name: state.templateName,
          template_json: templateJson,
          is_default: true,
        };

        if (state.templateId) {
          await api.put(`/events/${eventId}/badge-templates/${state.templateId}`, payload);
        } else {
          const res = await api.post(`/events/${eventId}/badge-templates`, payload);
          actions.setTemplateMeta(String(res.data.id), state.templateName);
        }
        toast({ title: 'Badge template saved to event!' });
      } else {
        // Save to localStorage for global mode
        const savedTemplates = JSON.parse(localStorage.getItem('badge-designer-templates') || '[]');
        const existing = savedTemplates.findIndex((t: any) => t.id === state.templateId);
        const entry = {
          id: state.templateId || `tpl_${Date.now()}`,
          name: state.templateName,
          layout: state.layout,
          updatedAt: new Date().toISOString(),
        };
        if (existing >= 0) {
          savedTemplates[existing] = entry;
        } else {
          savedTemplates.push(entry);
          actions.setTemplateMeta(entry.id, entry.name);
        }
        localStorage.setItem('badge-designer-templates', JSON.stringify(savedTemplates));
        toast({ title: 'Badge template saved locally!' });
        // Prompt organizer to attach this design to an event
        setAssignDialogOpen(true);
      }

      actions.markClean();
    } catch (error) {
      console.error('Save failed:', error);
      
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        toast({ 
          title: 'Storage Quota Exceeded', 
          description: 'The template is too large for local storage. Please assign it to an event or use smaller images.', 
          variant: 'destructive',
          action: (
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              Export JSON
            </Button>
          )
        });
      } else {
        toast({ title: 'Failed to save template', description: 'Please try again.', variant: 'destructive' });
      }
    }
  }, [state, eventId, actions, handleExportJSON]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.layout) {
            actions.setLayout(data.layout as BadgeLayout);
            if (data.name) actions.setTemplateName(data.name);
            toast({ title: 'Template imported!' });
          } else {
            toast({ title: 'Invalid template file', variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Failed to parse template file', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [actions]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
      <AssignToEventDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        templateName={state.templateName}
        layout={state.layout}
        onAssigned={(assignedEventId) => {
          toast({ title: 'Assigned! Opening event…' });
          navigate(`/dashboard/events/${assignedEventId}`);
        }}
      />
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <Input
              value={state.templateName}
              onChange={(e) => actions.setTemplateName(e.target.value)}
              className="h-8 text-sm font-semibold border-none bg-transparent px-1 hover:bg-muted/50 focus:bg-muted/50 w-48"
            />
          </div>
          {state.isDirty && (
            <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleImportJSON}>
            <Upload className="h-4 w-4 mr-1.5" />
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={handleSaveTemplate} className="bg-brand-gradient text-primary-foreground">
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <DesignerToolbar
          activeTool={state.activeTool}
          zoom={state.zoom}
          showGrid={state.showGrid}
          snapToGrid={state.snapToGrid}
          canUndo={canUndo}
          canRedo={canRedo}
          badgeSize={state.layout.size}
          activeSide={state.activeSide}
          selectedCount={state.selectedElementIds.length}
          onSetTool={actions.setTool}
          onSetZoom={actions.setZoom}
          onToggleGrid={actions.toggleGrid}
          onToggleSnap={actions.toggleSnap}
          onUndo={actions.undo}
          onRedo={actions.redo}
          onSetBadgeSize={actions.setBadgeSize}
          onSetActiveSide={actions.setActiveSide}
          onAddText={handleAddText}
          onAddDynamicField={handleAddDynamicField}
          onAddImage={handleAddImage}
          onAddQRCode={handleAddQRCode}
          onAddShape={handleAddShape}
          onDeleteSelected={() => actions.deleteElements(state.selectedElementIds)}
          onDuplicateSelected={() => actions.duplicateElements(state.selectedElementIds)}
        />
      </div>

      {/* ── Main Editor Area ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Layers */}
        <div className="w-56 border-r border-border bg-card overflow-y-auto shrink-0">
          <LayersPanel
            elements={activeElements}
            selectedElementIds={state.selectedElementIds}
            onSelectElement={actions.selectElements}
            onUpdateElement={actions.updateElement}
          />

          {/* Background Controls */}
          <div className="border-t border-border p-3 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Background
            </h4>
            
            {/* Color Picker */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">Color</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={activeSide.backgroundColor}
                    onChange={(e) => actions.setBackgroundColor(e.target.value)}
                    className="w-7 h-7 rounded border border-border cursor-pointer p-0"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono uppercase">{activeSide.backgroundColor}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['#FFFFFF', '#f8fafc', '#f1f5f9', '#e2e8f0', '#1e293b', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    className="w-5 h-5 rounded-sm border border-border/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => actions.setBackgroundColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">Image</Label>
              {activeSide.backgroundImage ? (
                <div className="space-y-2">
                  <div className="relative rounded border border-border bg-muted/30 aspect-video overflow-hidden group">
                    <img 
                      src={activeSide.backgroundImage} 
                      alt="Background" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-white hover:bg-white/20"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const compressed = await compressImage(ev.target?.result as string);
                            actions.setBackgroundImage(compressed);
                          };
                            reader.readAsDataURL(file);
                          };
                          input.click();
                        }}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-white hover:bg-destructive"
                        onClick={() => actions.setBackgroundImage(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-16 border-dashed text-[10px] uppercase font-bold flex flex-col gap-1 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        const compressed = await compressImage(ev.target?.result as string);
                        actions.setBackgroundImage(compressed);
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Upload Background
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto">
          <BadgeCanvas
            elements={activeElements}
            selectedElementIds={state.selectedElementIds}
            badgeSize={badgeSize}
            backgroundColor={activeSide.backgroundColor}
            backgroundImage={activeSide.backgroundImage}
            zoom={state.zoom}
            showGrid={state.showGrid}
            snapToGrid={state.snapToGrid}
            gridSize={state.gridSize}
            sampleData={DEFAULT_SAMPLE_DATA}
            onSelectElement={actions.selectElements}
            onUpdateElement={actions.updateElement}
            onClearSelection={actions.clearSelection}
          />
        </div>

        {/* Right Panel: Properties */}
        <div className="w-64 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="px-3 py-2 border-b border-border">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Properties
            </h3>
          </div>
          <PropertyPanel
            selectedElements={selectedElements}
            onUpdateElement={actions.updateElement}
            onDeleteElements={actions.deleteElements}
            onDuplicateElements={actions.duplicateElements}
            onMoveLayer={actions.moveElementLayer}
          />
        </div>
      </div>
    </div>
  );
};

export default BadgeDesignPage;
