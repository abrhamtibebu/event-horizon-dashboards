import { useState, useEffect } from 'react';
import { Layout, Plus, Eye, Edit, Trash2, Copy, Mail, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export function TemplatesList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/marketing/templates');
      const data = response.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template: any) => {
    try {
      const response = await axios.get(`/api/marketing/templates/${template.id}/preview`);
      setPreviewContent(response.data);
      setSelectedTemplate(template);
      setShowPreview(true);
    } catch (error) {
      console.error('Error fetching preview:', error);
      alert('Failed to load preview');
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="w-4 h-4" />;
    if (type === 'sms') return <MessageSquare className="w-4 h-4" />;
    if (type === 'both') return <Sparkles className="w-4 h-4" />;
    return <Send className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      welcome: 'bg-purple-100 text-purple-800 border-purple-200',
      confirmation: 'bg-blue-100 text-blue-800 border-blue-200',
      reminder: 'bg-orange-100 text-orange-800 border-orange-200',
      promotional: 'bg-pink-100 text-pink-800 border-pink-200',
      feedback: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Filter templates
  const filteredTemplates = templates.filter((template: any) => {
    if (categoryFilter !== 'all' && template.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && template.type !== typeFilter) return false;
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group templates by category
  const groupedTemplates: any = {};
  filteredTemplates.forEach((template: any) => {
    const category = template.category || 'other';
    if (!groupedTemplates[category]) {
      groupedTemplates[category] = [];
    }
    groupedTemplates[category].push(template);
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading templates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-blue-600" />
                Message Templates
              </CardTitle>
              <CardDescription>
                {templates.length} professional templates ready to use
              </CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="confirmation">Confirmation</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Layout className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {templates.length === 0 ? 'No templates yet' : 'No templates match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {templates.length === 0 
                ? 'Run the seeder to add professional templates to your system' 
                : 'Try adjusting your filters or search query'}
            </p>
            {templates.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 font-mono">
                  php artisan db:seed --class=MarketingTemplateSeeder
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        Object.keys(groupedTemplates).map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize text-lg">
                {category === 'other' ? 'Other Templates' : `${category} Templates`}
              </CardTitle>
              <CardDescription>
                {groupedTemplates[category].length} template{groupedTemplates[category].length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTemplates[category].map((template: any) => (
                  <Card key={template.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <span className="text-xs font-medium text-gray-500 capitalize">
                            {template.type}
                          </span>
                        </div>
                        {template.is_system_template && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2 min-h-[40px]">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Category Badge */}
                        {template.category && (
                          <Badge 
                            variant="outline" 
                            className={`capitalize text-xs ${getCategoryColor(template.category)}`}
                          >
                            {template.category}
                          </Badge>
                        )}

                        {/* Usage Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Used {template.usage_count || 0} times</span>
                          {template.last_used_at && (
                            <span className="text-gray-400">
                              {new Date(template.last_used_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Variables */}
                        {template.available_variables && template.available_variables.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Variables: </span>
                            <code className="text-blue-600">
                              {template.available_variables.slice(0, 2).map((v: string) => `{{${v}}}`).join(', ')}
                              {template.available_variables.length > 2 && ` +${template.available_variables.length - 2} more`}
                            </code>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" title="Use in Campaign">
                            <Copy className="w-3 h-3" />
                          </Button>
                          {!template.is_system_template && (
                            <>
                              <Button variant="outline" size="sm" title="Edit Template">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm" title="Delete" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && getTypeIcon(selectedTemplate.type)}
              Template Preview: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {previewContent && (
            <div className="space-y-6">
              {/* Subject Line */}
              {previewContent.subject && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Subject Line
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-gray-900">{previewContent.subject}</p>
                  </div>
                </div>
              )}

              {/* Email Preview */}
              {previewContent.email_body && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Preview
                  </label>
                  <div 
                    className="border rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: previewContent.email_body }}
                  />
                </div>
              )}

              {/* SMS Preview */}
              {previewContent.sms_body && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    SMS Preview ({previewContent.sms_body.length} characters)
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border max-w-sm">
                    <div className="bg-blue-500 text-white p-3 rounded-lg rounded-bl-none">
                      <p className="text-sm leading-relaxed">{previewContent.sms_body}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sample SMS message</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button>
                  <Copy className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

