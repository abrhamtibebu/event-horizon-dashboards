import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Trash2, 
  Edit, 
  Eye,
  Plus,
  Download,
  Upload
} from 'lucide-react';
import { BadgeElement } from './SimpleBadge';
import SimpleBadge from './SimpleBadge';
import { Attendee } from '@/types/attendee';

interface BadgeTemplate {
  id: string;
  name: string;
  elements: BadgeElement[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

interface BadgeTemplateManagerProps {
  eventId?: string;
  onTemplateSelect?: (template: BadgeTemplate) => void;
  selectedTemplateId?: string;
}

// Sample attendee for preview
const SAMPLE_ATTENDEE: Attendee = {
  id: 1,
  guest: {
    id: 1,
    name: 'John Doe',
    company: 'Tech Corp',
    jobtitle: 'Software Engineer',
    email: 'john@techcorp.com',
    phone: '+1 (555) 123-4567',
    uuid: 'sample-uuid-123'
  },
  guest_type: { id: 1, name: 'VIP' },
  event_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const BadgeTemplateManager: React.FC<BadgeTemplateManagerProps> = ({
  eventId,
  onTemplateSelect,
  selectedTemplateId
}) => {
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<BadgeTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<BadgeTemplate | null>(null);

  // Load templates from localStorage
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('badge-templates');
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        setTemplates(parsedTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplates = (newTemplates: BadgeTemplate[]) => {
    try {
      localStorage.setItem('badge-templates', JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  };

  const createTemplate = (name: string, elements: BadgeElement[]) => {
    const newTemplate: BadgeTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      elements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    setShowCreateDialog(false);
    setNewTemplateName('');
    
    return newTemplate;
  };

  const updateTemplate = (id: string, updates: Partial<BadgeTemplate>) => {
    const updatedTemplates = templates.map(template =>
      template.id === id
        ? { ...template, ...updates, updatedAt: new Date().toISOString() }
        : template
    );
    saveTemplates(updatedTemplates);
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(template => template.id !== id);
      saveTemplates(updatedTemplates);
    }
  };

  const duplicateTemplate = (template: BadgeTemplate) => {
    const duplicatedTemplate: BadgeTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, duplicatedTemplate];
    saveTemplates(updatedTemplates);
  };

  const exportTemplate = (template: BadgeTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        if (template.name && template.elements) {
          createTemplate(template.name, template.elements);
        } else {
          alert('Invalid template file format');
        }
      } catch (error) {
        alert('Error importing template file');
      }
    };
    reader.readAsText(file);
  };

  const handlePreviewTemplate = (template: BadgeTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  const selectTemplate = (template: BadgeTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Badge Templates</h2>
          <p className="text-sm text-gray-600">Manage and assign badge templates to events</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importTemplate}
            className="hidden"
            id="import-template"
          />
          <label htmlFor="import-template">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newTemplateName.trim()) {
                        // Create with default elements
                        const defaultElements: BadgeElement[] = [
                          {
                            id: 'name-field',
                            type: 'guestField',
                            x: 50,
                            y: 50,
                            width: 300,
                            height: 40,
                            rotation: 0,
                            zIndex: 1,
                            visible: true,
                            guestField: 'name',
                            fontSize: 24,
                            fontFamily: 'Arial',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            textAlign: 'center'
                          },
                          {
                            id: 'company-field',
                            type: 'guestField',
                            x: 50,
                            y: 100,
                            width: 300,
                            height: 30,
                            rotation: 0,
                            zIndex: 2,
                            visible: true,
                            guestField: 'company',
                            fontSize: 18,
                            fontFamily: 'Arial',
                            fontWeight: 'normal',
                            color: '#475569',
                            textAlign: 'center'
                          },
                          {
                            id: 'qr-field',
                            type: 'guestField',
                            x: 150,
                            y: 200,
                            width: 100,
                            height: 100,
                            rotation: 0,
                            zIndex: 3,
                            visible: true,
                            guestField: 'qrCode'
                          }
                        ];
                        createTemplate(newTemplateName, defaultElements);
                      }
                    }}
                    disabled={!newTemplateName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
            <p className="text-gray-600 mb-4">Create your first badge template to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className={`${selectedTemplateId === template.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {selectedTemplateId === template.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Preview */}
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <div className="scale-50 origin-center">
                    <SimpleBadge attendee={SAMPLE_ATTENDEE} template={template.elements} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectTemplate(template)}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Select
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTemplate(template)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTemplate(template.id)}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{previewTemplate.name}</h3>
                <p className="text-sm text-gray-500">
                  {previewTemplate.elements.length} elements
                </p>
              </div>
              <div className="flex justify-center bg-gray-50 rounded-lg p-8">
                <SimpleBadge attendee={SAMPLE_ATTENDEE} template={previewTemplate.elements} />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    selectTemplate(previewTemplate);
                    setShowPreviewDialog(false);
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BadgeTemplateManager;
