import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Printer,
  Settings,
  Palette
} from 'lucide-react';
import SimpleBadgeDesigner from '@/components/SimpleBadgeDesigner';
import BadgeTemplateManager from '@/components/BadgeTemplateManager';
import SimpleBadge from '@/components/SimpleBadge';
import { BadgeElement } from '@/components/SimpleBadgeDesigner';
import { Attendee } from '@/types/attendee';
import api from '@/lib/api';

interface BadgeTemplate {
  id: string;
  name: string;
  elements: BadgeElement[];
  createdAt: string;
  updatedAt: string;
}

const BadgeDesignPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('design');
  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sampleAttendee, setSampleAttendee] = useState<Attendee | null>(null);

  // Load event data and sample attendee
  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      
      // Load event details
      const eventResponse = await api.get(`/events/${eventId}`);
      setEvent(eventResponse.data);

      // Load a sample attendee for preview
      const attendeesResponse = await api.get(`/events/${eventId}/attendees?limit=1`);
      if (attendeesResponse.data.data && attendeesResponse.data.data.length > 0) {
        setSampleAttendee(attendeesResponse.data.data[0]);
      } else {
        // Create a sample attendee if none exist
        setSampleAttendee({
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
          event_id: parseInt(eventId || '1'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: BadgeTemplate) => {
    setSelectedTemplate(template);
  };

  const saveEventTemplate = async (template: BadgeTemplate) => {
    if (!eventId) return;

    try {
      // Save template to event
      await api.post(`/events/${eventId}/badge-template`, {
        template_id: template.id,
        template_name: template.name,
        template_data: template.elements
      });

      // Update local state
      setSelectedTemplate(template);
      
      alert('Badge template assigned to event successfully!');
    } catch (error) {
      console.error('Error saving event template:', error);
      alert('Error saving badge template. Please try again.');
    }
  };

  const printSampleBadge = () => {
    if (!selectedTemplate || !sampleAttendee) return;

    // Create a hidden print area
    const printArea = document.createElement('div');
    printArea.style.position = 'absolute';
    printArea.style.left = '-9999px';
    printArea.style.top = '-9999px';
    printArea.innerHTML = `
      <div style="width: 400px; height: 400px; margin: 20px;">
        ${document.querySelector('.badge-preview')?.innerHTML || ''}
      </div>
    `;
    
    document.body.appendChild(printArea);
    
    // Print
    window.print();
    
    // Cleanup
    document.body.removeChild(printArea);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Badge Design</h1>
              <p className="text-sm text-gray-600">
                {event ? `Event: ${event.name}` : 'Design badges for your event'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTemplate && (
              <Badge variant="default">
                <Palette className="w-3 h-3 mr-1" />
                {selectedTemplate.name}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={printSampleBadge}
              disabled={!selectedTemplate || !sampleAttendee}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Sample
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="design">Design Badge</TabsTrigger>
            <TabsTrigger value="templates">Manage Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview & Test</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Badge Designer */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Badge Designer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SimpleBadgeDesigner />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={() => setActiveTab('templates')}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab('preview')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Badge
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={printSampleBadge}
                      disabled={!selectedTemplate || !sampleAttendee}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Sample
                    </Button>
                  </CardContent>
                </Card>

                {/* Event Info */}
                {event && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Event Name</p>
                        <p className="text-sm text-gray-600">{event.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date</p>
                        <p className="text-sm text-gray-600">
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">{event.location || 'TBD'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <BadgeTemplateManager
              eventId={eventId}
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Badge Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Badge Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTemplate && sampleAttendee ? (
                    <div className="flex justify-center bg-gray-50 rounded-lg p-8">
                      <div className="badge-preview">
                        <SimpleBadge 
                          attendee={sampleAttendee} 
                          template={selectedTemplate.elements} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎨</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Template Selected</h3>
                      <p className="text-gray-600 mb-4">Select a template to preview the badge</p>
                      <Button onClick={() => setActiveTab('templates')}>
                        Choose Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTemplate ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Template Name</p>
                        <p className="text-lg font-semibold">{selectedTemplate.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Elements</p>
                        <p className="text-sm text-gray-600">{selectedTemplate.elements.length} elements</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Created</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Last Updated</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedTemplate.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="pt-4 border-t">
                        <Button
                          className="w-full"
                          onClick={() => saveEventTemplate(selectedTemplate)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Assign to Event
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Template Selected</h3>
                      <p className="text-gray-600 mb-4">Choose a template to see its details</p>
                      <Button onClick={() => setActiveTab('templates')}>
                        Browse Templates
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BadgeDesignPage;
