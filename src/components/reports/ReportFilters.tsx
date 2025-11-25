import React from 'react';
import { Filter, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ReportSection } from '@/types/reports';

interface ReportFiltersProps {
  reportSections: ReportSection[];
  visibleReports: Set<string>;
  onToggleReport: (reportId: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportSections,
  visibleReports,
  onToggleReport,
  onToggleAll,
}) => {
  const allSelected = visibleReports.size === reportSections.length;

  return (
    <div className="mb-6">
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-info rounded-lg flex items-center justify-center shadow-md">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Report Sections</h3>
              <p className="text-xs text-muted-foreground/70">Select which sections to display</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-info/10 px-3 py-1.5 rounded-full border border-info/30">
              <Eye className="w-4 h-4 text-info" />
              <span className="text-sm font-medium text-info">
                {visibleReports.size} of {reportSections.length}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-card border-border hover:bg-accent shadow-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Customize Sections
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Select Report Sections</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleAll(!allSelected)}
                    className="h-7 text-xs"
                  >
                    {allSelected ? (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Select All
                      </>
                    )}
                  </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {reportSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <DropdownMenuCheckboxItem
                      key={section.id}
                      checked={visibleReports.has(section.id)}
                      onCheckedChange={() => onToggleReport(section.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{section.label}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};




















