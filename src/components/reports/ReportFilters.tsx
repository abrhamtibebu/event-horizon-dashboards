import React from 'react';
import { Filter, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="border-border/80">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Visible Sections</h3>
            <p className="text-xs text-muted-foreground">
              {visibleReports.size} of {reportSections.length} shown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Customize
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
                      <EyeOff className="mr-1 h-3 w-3" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3 w-3" />
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
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{section.label}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            className="h-9"
            onClick={() => onToggleAll(!allSelected)}
          >
            {allSelected ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide all
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show all
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};




















