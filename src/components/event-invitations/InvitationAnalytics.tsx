import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, MousePointerClick, Share2, UserCheck, TrendingUp, Award } from 'lucide-react';
import { useInvitationAnalytics } from '@/lib/api/invitations';
import { formatNumber, formatConversionRate } from '@/lib/invitationUtils';
import { TimelineChart } from './charts/TimelineChart';
import { PlatformChart } from './charts/PlatformChart';
import { DeviceChart } from './charts/DeviceChart';
import { GeographicChart } from './charts/GeographicChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvitationAnalyticsProps {
  eventId: number;
  userId?: number;
  isOrganizer: boolean;
}

export function InvitationAnalytics({ eventId, userId, isOrganizer }: InvitationAnalyticsProps) {
  const [dateRange, setDateRange] = useState('30');
  const [viewFilter, setViewFilter] = useState<'all' | 'my'>('all');

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: analytics, isLoading } = useInvitationAnalytics(eventId, {
    start_date: startDate,
    end_date: endDate,
    user_id: viewFilter === 'my' ? userId : undefined
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <div className="text-center py-12 text-gray-500">
          <p>No analytics data available yet.</p>
          <p className="text-sm mt-2">Start sharing invitations to see analytics!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Date Range:</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isOrganizer && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">View:</label>
              <Select value={viewFilter} onValueChange={(value) => setViewFilter(value as 'all' | 'my')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invitations</SelectItem>
                  <SelectItem value="my">My Invitations Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Invitations</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(analytics.summary.total_invitations)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Clicks</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(analytics.summary.total_clicks)}
              </p>
            </div>
            <MousePointerClick className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Shares</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(analytics.summary.total_shares)}
              </p>
            </div>
            <Share2 className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Registrations</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatNumber(analytics.summary.total_registrations)}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold text-pink-600">
                {formatConversionRate(analytics.summary.total_registrations, analytics.summary.total_clicks)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-pink-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <TimelineChart data={analytics.timeline} />
        </div>
        
        <PlatformChart data={analytics.platforms} />
        <DeviceChart data={analytics.devices} />
        
        <div className="lg:col-span-2">
          <GeographicChart data={analytics.geographic} />
        </div>
      </div>

      {/* Top Inviters Leaderboard */}
      {isOrganizer && analytics.top_inviters && analytics.top_inviters.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Inviters
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Invitations</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead className="text-center">Registrations</TableHead>
                  <TableHead className="text-center">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.top_inviters.map((inviter, index) => (
                  <TableRow key={inviter.user_id}>
                    <TableCell className="font-bold">
                      {index + 1}
                      {index < 3 && (
                        <span className="ml-1">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{inviter.user_name}</TableCell>
                    <TableCell className="text-center">{inviter.invitations_sent}</TableCell>
                    <TableCell className="text-center">{inviter.total_clicks}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">
                      {inviter.total_registrations}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {formatConversionRate(inviter.total_registrations, inviter.total_clicks)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

