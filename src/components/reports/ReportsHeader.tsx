import React from 'react';
import { BarChart, Download, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <BarChart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics across all events</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <Select value={selectedEventId} onValueChange={onEventChange}>
          <SelectTrigger className="w-full sm:w-64 bg-card border-border shadow-sm">
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
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="bg-card border-border shadow-sm hover:bg-accent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <ProtectedButton
            permission="reports.export"
            onClick={onExportCSV}
            disabled={exporting}
            variant="outline"
            actionName="export reports to CSV"
            className="bg-card border-border shadow-sm hover:bg-accent"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </ProtectedButton>
          <ProtectedButton
            permission="reports.export"
            onClick={onExportPDF}
            disabled={generating}
            className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
            actionName="export reports to PDF"
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate PDF'}
          </ProtectedButton>
        </div>
      </div>
    </div>
  );
};



















