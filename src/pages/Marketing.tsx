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
import Breadcrumbs from '@/components/Breadcrumbs';
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
import { CampaignWizard } from '@/components/marketing/CampaignWizard';
import { CreateTemplate } from '@/components/marketing/CreateTemplate';
import { CreateSegment } from '@/components/marketing/CreateSegment';
import { LibraryView } from '@/components/marketing/LibraryView';
import { EnhancedAnalytics } from '@/components/marketing/EnhancedAnalytics';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { ProtectedButton } from '@/components/ProtectedButton';
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
  const [activeTab, setActiveTab] = useState('campaigns'); // Changed from 'overview' to 'campaigns'
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
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
      blue: 'text-info bg-info/10',
      green: 'text-success bg-success/10',
      orange: 'text-warning bg-warning/10',
      purple: 'text-primary bg-primary/10',
      red: 'text-error bg-error/10',
    } as const;

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="w-5 h-5" />
            </div>
            {growth !== undefined && (
              <div className={`flex items-center text-sm ${
                growth >= 0 ? 'text-success' : 'text-error'
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
          <CardDescription className="text-sm font-medium text-muted-foreground">
            {title}
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-card-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
          )}
        </CardHeader>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" variant="primary" text="Loading marketing dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Marketing', href: '/dashboard/marketing' }
          ]}
          className="mb-4"
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Mail className="w-8 h-8 text-primary-foreground" />
                </div>
                Marketing Center
              </h1>
              <p className="mt-2 text-muted-foreground">
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
              onClick={() => setShowCampaignWizard(true)}
              size="lg"
              className="bg-brand-gradient text-foreground shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Campaign
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

        {/* Main Content Tabs - Simplified to 3 tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-card shadow-sm">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignsList onCreateNew={() => {
              if (checkPermission('marketing.campaigns', 'create campaigns')) {
                setShowCampaignWizard(true);
              }
            }} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <EnhancedAnalytics />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LibraryView 
              onNewTemplate={() => {
                if (checkPermission('marketing.templates', 'create templates')) {
                  setShowCreateTemplate(true);
                }
              }}
              onNewSegment={() => {
                if (checkPermission('marketing.segments', 'create segments')) {
                  setShowCreateSegment(true);
                }
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Campaign Wizard Dialog */}
        {showCampaignWizard && (
          <CampaignWizard 
            open={showCampaignWizard} 
            onClose={() => setShowCampaignWizard(false)}
            onComplete={() => {
              setShowCampaignWizard(false)
              toast.success('Campaign created successfully!')
              fetchStats() // Refresh the stats
            }}
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
  )
}

