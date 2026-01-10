import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Star,
  Users,
  Building,
  User,
  UserCog,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

import { formTemplateApi } from '@/lib/api/forms';
import type { FormTemplate, FormTemplateCategory } from '@/types/forms';

interface FormTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: FormTemplate) => void;
  onCreateBlank: () => void;
  participantType?: string;
}

export const FormTemplateSelector: React.FC<FormTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateBlank,
  participantType
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  // Fetch templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ['form-templates', selectedCategory, searchTerm],
    queryFn: () => formTemplateApi.getTemplates({
      form_type: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchTerm || undefined
    }),
    enabled: isOpen,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['form-template-categories'],
    queryFn: () => formTemplateApi.getCategories(),
    enabled: isOpen,
  });

  const templates = templatesData?.data || [];
  const filteredTemplates = templates.filter(template => {
    if (participantType && template.form_type !== participantType) {
      return false;
    }
    return true;
  });

  const handleSelectTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
      setSelectedTemplate(null);
    }
  };

  const getCategoryIcon = (categoryKey: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      attendee: Users,
      exhibitor: Building,
      speaker: User,
      staff: UserCog,
      sponsor: Star,
    };
    return icons[categoryKey] || FileText;
  };

  const getTemplateIcon = (formType: string) => {
    return getCategoryIcon(formType);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Choose a Form Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories && Object.entries(categories).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-96">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading templates...</span>
              </div>
            ) : templatesError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load templates. Please try again later.
                </AlertDescription>
              </Alert>
            ) : filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  const IconComponent = getTemplateIcon(template.form_type);
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary border-primary' : ''
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge variant="outline" className="text-xs capitalize mt-1">
                                {template.form_type}
                              </Badge>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {template.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {template.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {template.template_data?.fields?.length || 0} fields
                          </span>
                          {template.is_public && (
                            <Badge variant="secondary" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No templates found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No templates are available for this participant type.'}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onCreateBlank}>
              <Plus className="w-4 h-4 mr-2" />
              Start with Blank Form
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedTemplate}
              >
                Use Selected Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormTemplateSelector;
