import { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  Eye,
  Trash2,
  Edit,
  Pause,
  Play,
  XCircle,
  Clock,
  CheckCircle2,
  BarChart3,
  MoreVertical,
  Calendar,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

interface Campaign {
  id: number;
  uuid: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  scheduled_at: string | null;
  created_at: string;
  event?: { title: string };
}

interface CampaignsListProps {
  onCreateNew: () => void;
}

export function CampaignsList({ onCreateNew }: CampaignsListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, typeFilter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get('/api/marketing/campaigns', { params });
      
      // Ensure we always set an array
      const data = response.data.data || response.data;
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (campaignId: number) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;
    
    try {
      await axios.post(`/api/marketing/campaigns/${campaignId}/send`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const handlePause = async (campaignId: number) => {
    try {
      await axios.post(`/api/marketing/campaigns/${campaignId}/pause`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleCancel = async (campaignId: number) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    
    try {
      await axios.post(`/api/marketing/campaigns/${campaignId}/cancel`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error cancelling campaign:', error);
    }
  };

  const handleDelete = async (campaignId: number) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/marketing/campaigns/${campaignId}`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { color: 'bg-gray-500', icon: Edit },
      scheduled: { color: 'bg-blue-500', icon: Clock },
      sending: { color: 'bg-yellow-500', icon: Send },
      sent: { color: 'bg-green-500', icon: CheckCircle2 },
      paused: { color: 'bg-orange-500', icon: Pause },
      cancelled: { color: 'bg-red-500', icon: XCircle },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.draft;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="w-4 h-4" />;
    if (type === 'sms') return <MessageSquare className="w-4 h-4" />;
    return <Send className="w-4 h-4" />;
  };

  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.sent_count === 0) return '0%';
    return `${((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)}%`;
  };

  const calculateClickRate = (campaign: Campaign) => {
    if (campaign.sent_count === 0) return '0%';
    return `${((campaign.clicked_count / campaign.sent_count) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading campaigns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Manage your email and SMS marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCampaigns()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <Button onClick={fetchCampaigns} variant="outline">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Create your first marketing campaign to get started</p>
              <Button onClick={onCreateNew}>
                <Send className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        {campaign.event && (
                          <div className="text-sm text-gray-500">{campaign.event.title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(campaign.type)}
                        <span className="capitalize">{campaign.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">{campaign.total_recipients.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaign.sent_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{calculateOpenRate(campaign)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{calculateClickRate(campaign)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {campaign.scheduled_at ? (
                          <>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(campaign.scheduled_at).toLocaleDateString()}
                          </>
                        ) : (
                          new Date(campaign.created_at).toLocaleDateString()
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          {campaign.status === 'draft' && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSend(campaign.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                            </>
                          )}
                          {campaign.status === 'sending' && (
                            <DropdownMenuItem onClick={() => handlePause(campaign.id)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'scheduled' && (
                            <DropdownMenuItem onClick={() => handleCancel(campaign.id)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(campaign.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

