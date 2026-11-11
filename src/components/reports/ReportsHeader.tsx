import React from 'react';
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance, revenue, and attendees.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={selectedEventId} onValueChange={onEventChange}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {eventsList.map((event) => (
              <SelectItem key={event.id} value={String(event.id)}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          <ProtectedButton permission="reports.export" onClick={onRefresh} disabled={refreshing} variant="outline" actionName="refresh reports">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ProtectedButton>
          <ProtectedButton permission="reports.export" onClick={onExportCSV} disabled={exporting} variant="outline" actionName="export reports to CSV">
            {exporting ? 'Exporting...' : 'CSV'}
          </ProtectedButton>
          <ProtectedButton permission="reports.export" onClick={onExportPDF} disabled={generating} actionName="export reports to PDF">
            {generating ? 'Generating...' : 'PDF'}
          </ProtectedButton>
        </div>
      </div>
    </div>
  );
};



















