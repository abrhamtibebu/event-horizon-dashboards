import React from 'react';
import { BarChart3, Download, FileText, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProtectedButton } from '@/components/ProtectedButton';
import { Event } from '@/types/reports';

interface ReportsHeaderProps {
  selectedEventId: string;
  onEventChange: (eventId: string) => void;
  eventsList: Event[];
  onExportCSV: () => void;
  onExportPDF: () => void;
  onRefresh: () => void;
  exporting: boolean;
  generating: boolean;
  refreshing: boolean;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  selectedEventId,
  onEventChange,
  eventsList,
  onExportCSV,
  onExportPDF,
  onRefresh,
  exporting,
  generating,
  refreshing,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Clear performance, revenue, and attendee insights.
          </p>
        </div>
      </div>

      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectedEventId} onValueChange={onEventChange}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventsList.map((event) => (
                <SelectItem key={event.id} value={String(event.id)}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-2">
            <ProtectedButton
              permission="reports.export"
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              actionName="refresh reports"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </ProtectedButton>
            <ProtectedButton
              permission="reports.export"
              onClick={onExportCSV}
              disabled={exporting}
              variant="outline"
              actionName="export reports to CSV"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'CSV'}
            </ProtectedButton>
            <ProtectedButton
              permission="reports.export"
              onClick={onExportPDF}
              disabled={generating}
              actionName="export reports to PDF"
            >
              <FileText className="mr-2 h-4 w-4" />
              {generating ? 'Generating...' : 'PDF'}
            </ProtectedButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



















