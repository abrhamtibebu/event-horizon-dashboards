import { useState, useEffect } from 'react';
import { X, Users, Plus, Minus, Save, Eye, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CreateSegmentProps {
  open: boolean;
  onClose: () => void;
}

interface Criterion {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
  label: string;
}

interface CriteriaOption {
  type: string;
  label: string;
  options?: Record<string, string>;
  min?: number;
  max?: number;
}

interface CriteriaGroup {
  label: string;
  criteria: Record<string, CriteriaOption>;
}

export function CreateSegment({ open, onClose }: CreateSegmentProps) {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [criteriaOptions, setCriteriaOptions] = useState<Record<string, CriteriaGroup>>({});
  const [previewRecipients, setPreviewRecipients] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_dynamic: true,
  });

  const [criteria, setCriteria] = useState<Criterion[]>([]);

  useEffect(() => {
    if (open) {
      fetchCriteriaOptions();
    }
  }, [open]);

  const fetchCriteriaOptions = async () => {
    try {
      const response = await api.get('/marketing/segments/criteria-options');
      setCriteriaOptions(response.data);
    } catch (error) {
      console.error('Error fetching criteria options:', error);
      toast.error('Failed to load criteria options');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      field: '',
      operator: '=',
      value: '',
      label: '',
    };
    setCriteria(prev => [...prev, newCriterion]);
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, field: string, value: any) => {
    setCriteria(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const getFieldOptions = (criterion: Criterion) => {
    const allFields: Record<string, CriteriaOption> = {};
    Object.values(criteriaOptions).forEach(group => {
      Object.assign(allFields, group.criteria);
    });
    return allFields;
  };

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'select':
        return [
          { value: '=', label: 'Equals' },
          { value: '!=', label: 'Not equals' },
        ];
      case 'text':
        return [
          { value: '=', label: 'Equals' },
          { value: '!=', label: 'Not equals' },
          { value: 'like', label: 'Contains' },
        ];
      case 'range':
        return [
          { value: '>=', label: 'Greater than or equal' },
          { value: '<=', label: 'Less than or equal' },
          { value: 'between', label: 'Between' },
        ];
      case 'boolean':
        return [
          { value: '=', label: 'Is true' },
          { value: '!=', label: 'Is false' },
        ];
      case 'date_range':
        return [
          { value: 'between', label: 'Between dates' },
          { value: '>=', label: 'After date' },
          { value: '<=', label: 'Before date' },
        ];
      default:
        return [{ value: '=', label: 'Equals' }];
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Segment name is required');
    if (criteria.length === 0) errors.push('At least one criterion is required');
    
    // Validate criteria
    criteria.forEach((criterion, index) => {
      if (!criterion.field) errors.push(`Criterion ${index + 1}: Field is required`);
      if (!criterion.value || (Array.isArray(criterion.value) && criterion.value.length === 0)) {
        errors.push(`Criterion ${index + 1}: Value is required`);
      }
    });
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        criteria: criteria.map(c => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      };

      const response = await api.post('/marketing/segments', payload);
      
      toast.success('Segment created successfully!');
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        is_dynamic: true,
      });
      setCriteria([]);
      setPreviewMode(false);
      
    } catch (error: any) {
      console.error('Error creating segment:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to create segment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const payload = {
        criteria: criteria.map(c => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      };

      const response = await api.post('/marketing/segments/preview', payload);
      setPreviewRecipients(response.data.recipients || []);
      setPreviewMode(true);
      
    } catch (error: any) {
      console.error('Error previewing segment:', error);
      toast.error('Failed to preview segment');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Segment Preview</h3>
        <Button variant="outline" onClick={() => setPreviewMode(false)}>
          <X className="w-4 h-4 mr-2" />
          Close Preview
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview Recipients (First 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {previewRecipients.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No recipients found matching the criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {previewRecipients.map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{recipient.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{recipient.email || recipient.phone || 'N/A'}</p>
                  </div>
                  {recipient.company && (
                    <Badge variant="outline" className="text-xs">
                      {recipient.company}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Segment Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Active Event Attendees"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_dynamic"
            checked={formData.is_dynamic}
            onCheckedChange={(checked) => handleChange('is_dynamic', checked)}
          />
          <Label htmlFor="is_dynamic">Dynamic Segment</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of this segment"
          rows={2}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Segmentation Criteria</Label>
          <Button variant="outline" size="sm" onClick={addCriterion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Criterion
          </Button>
        </div>

        <div className="space-y-3">
          {criteria.map((criterion) => {
            const fieldOptions = getFieldOptions(criterion);
            const selectedField = fieldOptions[criterion.field];
            const operatorOptions = getOperatorOptions(selectedField?.type || 'select');

            return (
              <Card key={criterion.id}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={criterion.field}
                        onValueChange={(value) => {
                          updateCriterion(criterion.id, 'field', value);
                          updateCriterion(criterion.id, 'operator', '=');
                          updateCriterion(criterion.id, 'value', '');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(criteriaOptions).map(([groupKey, group]) => (
                            <div key={groupKey}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                                {group.label}
                              </div>
                              {Object.entries(group.criteria).map(([key, option]) => (
                                <SelectItem key={key} value={key}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs">Operator</Label>
                      <Select
                        value={criterion.operator}
                        onValueChange={(value) => updateCriterion(criterion.id, 'operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-5">
                      <Label className="text-xs">Value</Label>
                      {selectedField?.type === 'select' ? (
                        <Select
                          value={criterion.value as string}
                          onValueChange={(value) => updateCriterion(criterion.id, 'value', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedField.options && Object.entries(selectedField.options).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : selectedField?.type === 'range' ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Min"
                            type="number"
                            value={Array.isArray(criterion.value) ? criterion.value[0] : ''}
                            onChange={(e) => {
                              const newValue = Array.isArray(criterion.value) ? [...criterion.value] : ['', ''];
                              newValue[0] = e.target.value;
                              updateCriterion(criterion.id, 'value', newValue);
                            }}
                          />
                          <Input
                            placeholder="Max"
                            type="number"
                            value={Array.isArray(criterion.value) ? criterion.value[1] : ''}
                            onChange={(e) => {
                              const newValue = Array.isArray(criterion.value) ? [...criterion.value] : ['', ''];
                              newValue[1] = e.target.value;
                              updateCriterion(criterion.id, 'value', newValue);
                            }}
                          />
                        </div>
                      ) : (
                        <Input
                          placeholder="Enter value"
                          value={Array.isArray(criterion.value) ? criterion.value.join(', ') : criterion.value}
                          onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                        />
                      )}
                    </div>

                    <div className="col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriterion(criterion.id)}
                        className="w-full"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {criteria.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Filter className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No criteria added yet</p>
              <p className="text-sm text-gray-400">Add criteria to define your audience segment</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Create Audience Segment
          </DialogTitle>
          <DialogDescription>
            Define criteria to create targeted audience segments for your campaigns
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {previewMode ? renderPreview() : renderForm()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {previewMode && (
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Back to Edit
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              {!previewMode && (
                <Button variant="outline" onClick={handlePreview} disabled={loading}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Segment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
