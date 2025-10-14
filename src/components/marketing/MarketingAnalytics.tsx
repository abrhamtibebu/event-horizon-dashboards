import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Mail, MousePointer, UserX, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

export function MarketingAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/marketing/analytics/overview');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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

  const summary = analytics?.summary || {};
  const topCampaigns = analytics?.top_campaigns || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sent</CardDescription>
            <CardTitle className="text-3xl">{summary.total_sent?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-blue-600">
              <Mail className="w-4 h-4 mr-1" />
              <span>All campaigns</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Open Rate</CardDescription>
            <CardTitle className="text-3xl">{summary.open_rate?.toFixed(1) || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Industry avg: 21.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Click Rate</CardDescription>
            <CardTitle className="text-3xl">{summary.click_rate?.toFixed(1) || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-blue-600">
              <MousePointer className="w-4 h-4 mr-1" />
              <span>Industry avg: 2.6%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unsubscribe Rate</CardDescription>
            <CardTitle className="text-3xl">{summary.unsubscribe_rate?.toFixed(2) || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600">
              <UserX className="w-4 h-4 mr-1" />
              <span>{summary.total_unsubscribed || 0} total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>Campaigns with the highest engagement rates</CardDescription>
        </CardHeader>
        <CardContent>
          {topCampaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No campaign data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {topCampaigns.map((campaign: any, index: number) => (
                <div key={campaign.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span>Sent: {campaign.sent_count.toLocaleString()}</span>
                      <span>Opened: {campaign.opened_count.toLocaleString()}</span>
                      <span>Clicked: {campaign.clicked_count.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{campaign.open_rate}%</div>
                    <div className="text-sm text-gray-600">Open Rate</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{campaign.click_rate}%</div>
                    <div className="text-sm text-gray-600">Click Rate</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Trends</CardTitle>
          <CardDescription>Performance metrics over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Chart visualization coming soon</p>
              <p className="text-sm">Install chart library (recharts) for detailed visualizations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

