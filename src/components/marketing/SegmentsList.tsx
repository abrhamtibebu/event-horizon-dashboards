import { useState, useEffect } from 'react';
import { Users, Plus, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

export function SegmentsList() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await axios.get('/api/marketing/segments');
      const data = response.data;
      setSegments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching segments:', error);
      setSegments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (segmentId: number) => {
    try {
      await axios.post(`/api/marketing/segments/${segmentId}/recalculate`);
      fetchSegments();
    } catch (error) {
      console.error('Error recalculating segment:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audience Segments</CardTitle>
              <CardDescription>Target specific groups of contacts</CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Segment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No segments yet</h3>
              <p className="text-gray-600 mb-4">Create segments to target specific audience groups</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Segment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment: any) => (
                <Card key={segment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{segment.name}</h3>
                          {segment.is_dynamic && (
                            <Badge variant="secondary">Dynamic</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-2xl font-bold text-blue-600">
                              {segment.recipient_count.toLocaleString()}
                            </span>
                            <span className="text-gray-600 ml-2">recipients</span>
                          </div>
                          {segment.last_calculated_at && (
                            <div className="text-gray-500 text-xs">
                              Last updated: {new Date(segment.last_calculated_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRecalculate(segment.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Recalculate
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

