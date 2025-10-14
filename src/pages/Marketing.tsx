import { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Users, 
  Layout, 
  BarChart3,
  Plus,
  Send,
  Eye,
  Trash2,
  Edit,
  Pause,
  Play,
  XCircle,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CampaignsList } from '@/components/marketing/CampaignsList';
import { CreateCampaign } from '@/components/marketing/CreateCampaign';
import { CreateTemplate } from '@/components/marketing/CreateTemplate';
import { CreateSegment } from '@/components/marketing/CreateSegment';
import { TemplatesList } from '@/components/marketing/TemplatesList';
import { SegmentsList } from '@/components/marketing/SegmentsList';
import { MarketingAnalytics } from '@/components/marketing/MarketingAnalytics';
import { toast } from 'sonner';
import api from '@/lib/api';

interface MarketingStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalUnsubscribes: number;
  campaignsGrowth: number;
  openRateGrowth: number;
  clickRateGrowth: number;
}

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateSegment, setShowCreateSegment] = useState(false);
  const [stats, setStats] = useState<MarketingStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    totalUnsubscribes: 0,
    campaignsGrowth: 0,
    openRateGrowth: 0,
    clickRateGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/marketing/analytics/overview');
      const data = response.data.data || response.data;
      
      if (data && data.summary) {
        setStats({
          totalCampaigns: data.summary.total_campaigns || 0,
          activeCampaigns: data.summary.active_campaigns || 0,
          totalSent: data.summary.total_sent || 0,
          avgOpenRate: data.summary.open_rate || 0,
          avgClickRate: data.summary.click_rate || 0,
          totalUnsubscribes: data.summary.total_unsubscribed || 0,
          campaignsGrowth: 0, // Not available in current API
          openRateGrowth: 0, // Not available in current API
          clickRateGrowth: 0, // Not available in current API
        });
      }
    } catch (error) {
      console.error('Error fetching marketing stats:', error);
      toast.error('Failed to fetch marketing statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setRefreshing(true);
      
      // Export campaigns data
      const campaignsResponse = await api.get('/marketing/campaigns');
      const campaignsData = campaignsResponse.data.data || campaignsResponse.data;
      
      // Export templates data
      const templatesResponse = await api.get('/marketing/templates');
      const templatesData = templatesResponse.data.data || templatesResponse.data;
      
      // Export segments data
      const segmentsResponse = await api.get('/marketing/segments');
      const segmentsData = segmentsResponse.data.data || segmentsResponse.data;
      
      // Create export data
      const exportData = {
        export_date: new Date().toISOString(),
        campaigns: campaignsData,
        templates: templatesData,
        segments: segmentsData,
        statistics: stats,
      };
      
      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `marketing-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Marketing data exported successfully!');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export marketing data');
    } finally {
      setRefreshing(false);
    }
  };


  const StatCard = ({ 
    title, 
    value, 
    growth, 
    icon: Icon, 
    color = 'blue',
    subtitle 
  }: {
    title: string;
    value: string | number;
    growth?: number;
    icon: any;
    color?: string;
    subtitle?: string;
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      orange: 'text-orange-600 bg-orange-50',
      purple: 'text-purple-600 bg-purple-50',
      red: 'text-red-600 bg-red-50',
    };

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="w-5 h-5" />
            </div>
            {growth !== undefined && (
              <div className={`flex items-center text-sm ${
                growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {growth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {Math.abs(growth)}%
              </div>
            )}
          </div>
          <CardDescription className="text-sm font-medium text-gray-600">
            {title}
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </CardHeader>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                Marketing Center
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Create, manage, and analyze your email and SMS marketing campaigns
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchStats}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            <Button 
              onClick={() => setShowCreateCampaign(true)}
              size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Campaign
            </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            growth={stats.campaignsGrowth}
            icon={Send}
            color="blue"
            subtitle="All time campaigns"
          />
          <StatCard
            title="Active Now"
            value={stats.activeCampaigns}
            icon={Activity}
            color="green"
            subtitle="Currently running"
          />
          <StatCard
            title="Total Sent"
            value={stats.totalSent}
            icon={Mail}
            color="purple"
            subtitle="Messages delivered"
          />
          <StatCard
            title="Avg. Open Rate"
            value={`${stats.avgOpenRate.toFixed(1)}%`}
            growth={stats.openRateGrowth}
            icon={Eye}
            color="orange"
            subtitle="Industry avg: 21.5%"
          />
              </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Avg. Click Rate"
            value={`${stats.avgClickRate.toFixed(1)}%`}
            growth={stats.clickRateGrowth}
            icon={Target}
            color="blue"
            subtitle="Industry avg: 2.6%"
          />
          <StatCard
            title="Unsubscribes"
            value={stats.totalUnsubscribes}
            icon={XCircle}
            color="red"
            subtitle={`${stats.totalSent > 0 ? ((stats.totalUnsubscribes / stats.totalSent) * 100).toFixed(2) : 0}% rate`}
          />
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <CardDescription className="text-sm font-medium text-blue-700">
                  Quick Actions
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateTemplate(true)}
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateSegment(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Build Segment
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleExportData}
                  disabled={refreshing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Recent Campaigns
                  </CardTitle>
                  <CardDescription>Your latest marketing activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Sample Campaign {i}</p>
                            <p className="text-xs text-gray-500">2 hours ago</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Sent
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>Campaign performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Chart visualization coming soon</p>
                      <p className="text-sm">Install chart library for detailed analytics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsList onCreateNew={() => setShowCreateCampaign(true)} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesList />
          </TabsContent>

          <TabsContent value="segments">
            <SegmentsList />
          </TabsContent>

          <TabsContent value="analytics">
            <MarketingAnalytics />
          </TabsContent>
        </Tabs>

        {/* Create Campaign Dialog */}
        {showCreateCampaign && (
          <CreateCampaign 
            open={showCreateCampaign} 
            onClose={() => setShowCreateCampaign(false)} 
          />
        )}

        {/* Create Template Dialog */}
        {showCreateTemplate && (
          <CreateTemplate 
            open={showCreateTemplate} 
            onClose={() => setShowCreateTemplate(false)} 
          />
        )}

        {/* Create Segment Dialog */}
        {showCreateSegment && (
          <CreateSegment 
            open={showCreateSegment} 
            onClose={() => setShowCreateSegment(false)} 
          />
        )}
      </div>
    </div>
  );
}

