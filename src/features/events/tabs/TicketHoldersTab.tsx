import type { ReactNode } from 'react'
import { FileSpreadsheet, FileText, Plus, Printer, RefreshCw, Search, Star, Ticket, Upload, UserCheck, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FilterOption {
  id: number | string
  name: string
}

interface TicketHoldersTabProps {
  isTicketed: boolean
  totalCount: number
  checkedInCount: number
  notCheckedInCount: number
  searchTerm: string
  guestTypeFilter: string
  checkedInFilter: string
  ticketTypes: FilterOption[]
  guestTypes: FilterOption[]
  selectedCount: number
  onSearchChange: (value: string) => void
  onGuestTypeFilterChange: (value: string) => void
  onCheckedInFilterChange: (value: string) => void
  onExport: () => void
  onImport: () => void
  onAdd: () => void
  onPrintSelected: () => void
  searchPlaceholder?: string
  children: ReactNode
}

export function TicketHoldersTab({
  isTicketed,
  totalCount,
  checkedInCount,
  notCheckedInCount,
  searchTerm,
  guestTypeFilter,
  checkedInFilter,
  ticketTypes,
  guestTypes,
  selectedCount,
  onSearchChange,
  onGuestTypeFilterChange,
  onCheckedInFilterChange,
  onExport,
  onImport,
  onAdd,
  onPrintSelected,
  searchPlaceholder = 'Search by name, email, phone, company or job title...',
  children,
}: TicketHoldersTabProps) {
  const filterOptions = isTicketed ? ticketTypes : guestTypes

  return (
    <div className="flex w-full max-w-full flex-col gap-4 sm:gap-6">
      <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:mb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card sm:h-12 sm:w-12">
            <Users className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
              {isTicketed ? 'Ticket Holders' : 'Attendees List'}
              <Star className="hidden h-4 w-4 text-muted-foreground sm:inline sm:h-5 sm:w-5" />
            </h3>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              <RefreshCw className="h-3 w-3" />
              Auto-updates in 2 min
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {!isTicketed && selectedCount > 0 && (
            <Button
              variant="outline"
              onClick={onPrintSelected}
              disabled={selectedCount === 0}
              className="h-9 bg-background px-3 text-xs hover:bg-accent sm:h-10 sm:px-4 sm:text-sm"
            >
              <Printer className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Print Selected ({selectedCount})</span>
              <span className="sm:hidden">Print ({selectedCount})</span>
            </Button>
          )}
          {!isTicketed && (
            <>
              <Button
                variant="outline"
                onClick={onImport}
                className="h-9 bg-background px-3 text-xs hover:bg-accent sm:h-10 sm:px-4 sm:text-sm"
              >
                <Upload className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                className="h-9 bg-success px-3 text-xs text-white hover:bg-success/90 sm:h-10 sm:px-4 sm:text-sm"
                onClick={onAdd}
              >
                <Plus className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">+ Add New Attendee</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-4 rounded-lg border border-border bg-card p-3 sm:mb-6 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard title={isTicketed ? 'Total ticket holders' : 'Total attendees'} value={totalCount} icon={<Ticket className="h-4 w-4 text-primary sm:h-5 sm:w-5" />} iconClassName="bg-primary/10 text-primary" />
          <SummaryCard title="Checked in" value={checkedInCount} icon={<UserCheck className="h-4 w-4 text-success sm:h-5 sm:w-5" />} iconClassName="bg-success/10 text-success" />
          <SummaryCard title="Not checked in" value={notCheckedInCount} icon={<Clock className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />} iconClassName="bg-muted text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={guestTypeFilter} onValueChange={onGuestTypeFilterChange}>
                <SelectTrigger className="h-9 w-full border-border bg-background text-sm sm:h-10 sm:w-[180px]">
                  <SelectValue placeholder={isTicketed ? 'All ticket types' : 'All guest types'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isTicketed ? 'All ticket types' : 'All guest types'}</SelectItem>
                  {filterOptions.map((type) => (
                    <SelectItem key={type.id} value={type.name.toLowerCase()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex w-full rounded-full bg-muted/60 p-1 sm:w-auto">
              <StatusPill active={checkedInFilter === 'all'} onClick={() => onCheckedInFilterChange('all')}>
                All
              </StatusPill>
              <StatusPill active={checkedInFilter === 'checked-in'} onClick={() => onCheckedInFilterChange('checked-in')}>
                Checked in
              </StatusPill>
              <StatusPill active={checkedInFilter === 'not-checked-in'} onClick={() => onCheckedInFilterChange('not-checked-in')}>
                Not checked in
              </StatusPill>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative w-full flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 border-border bg-background pl-9 text-sm sm:h-10"
              />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-9 flex-1 border-border bg-background px-3 text-xs hover:bg-accent sm:h-10 sm:flex-initial sm:px-4 sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-9 flex-1 border-border bg-background px-3 text-xs hover:bg-accent sm:h-10 sm:flex-initial sm:px-4 sm:text-sm"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string
  value: number
  icon: ReactNode
  iconClassName: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 sm:px-4 sm:py-3">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-xs">{title}</p>
        <p className="text-lg font-semibold text-foreground sm:text-xl">{value}</p>
      </div>
      <div className={`rounded-full p-2 sm:p-2.5 ${iconClassName}`}>{icon}</div>
    </div>
  )
}

function StatusPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'ghost'}
      className="h-8 flex-1 rounded-full px-3 text-xs sm:h-9 sm:flex-none sm:px-4 sm:text-sm"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
