// Assign Badge Template to Event Dialog
// Lets user pick an event and assign the current badge design as the official template
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  CalendarDays,
  Check,
  Loader2,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { BadgeLayout } from '@/types/badge-designer';

interface AssignToEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  layout: BadgeLayout;
  onAssigned: (eventId: number, templateId: number) => void;
}

interface EventSummary {
  id: number;
  name: string;
  start_date: string | null;
  location: string | null;
  status: string;
  has_badge_template: boolean;
}

const AssignToEventDialog: React.FC<AssignToEventDialogProps> = ({
  open,
  onOpenChange,
  templateName,
  layout,
  onAssigned,
}) => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user's events when dialog opens
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedEventId(null);
      setError(null);
      setSuccess(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/events', { params: { per_page: 100 } });
        const evts = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        // Enrich with badge template info
        const enriched: EventSummary[] = evts.map((e: any) => ({
          id: e.id,
          name: e.name || e.title || 'Untitled Event',
          start_date: e.start_date || e.date || null,
          location: e.location || e.venue || null,
          status: e.status || 'active',
          has_badge_template: false, // Will be checked on selection
        }));

        setEvents(enriched);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [open]);

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedEventId) return;

    setAssigning(true);
    setError(null);

    try {
      const payload = {
        name: templateName,
        template_json: JSON.stringify(layout),
        is_default: true,
      };

      // Check if event already has templates
      let existingTemplates: any[] = [];
      try {
        const res = await api.get(`/events/${selectedEventId}/badge-templates`);
        existingTemplates = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch {
        // No templates exist yet
      }

      let templateId: number;

      // If there's already a default template, update it. Otherwise, create new.
      const defaultTemplate = existingTemplates.find((t: any) => t.is_default);
      if (defaultTemplate) {
        await api.put(
          `/events/${selectedEventId}/badge-templates/${defaultTemplate.id}`,
          payload
        );
        templateId = defaultTemplate.id;
      } else {
        const res = await api.post(
          `/events/${selectedEventId}/badge-templates`,
          payload
        );
        templateId = res.data.id;
      }

      setSuccess(true);
      onAssigned(selectedEventId, templateId);

      // Close after a short delay to show success state
      setTimeout(() => {
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to assign template:', err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to assign template. Please try again.'
      );
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Assign to Event
          </DialogTitle>
          <DialogDescription>
            Link <strong>"{templateName}"</strong> as the official badge design for an event.
            This design will be used whenever badges are printed for the selected event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Event List */}
          <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {search ? 'No events match your search' : 'No events found'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEvents.map((event) => {
                  const isSelected = selectedEventId === event.id;
                  return (
                    <button
                      key={event.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                        isSelected && 'bg-primary/5 border-l-2 border-primary'
                      )}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {event.start_date && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(event.start_date).toLocaleDateString()}
                            </span>
                          )}
                          {event.location && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 px-3 py-2 rounded-md">
              <Check className="h-4 w-4 flex-shrink-0" />
              Badge template assigned successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedEventId || assigning || success}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Assigning...
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Assigned!
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1.5" />
                  Assign to Event
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignToEventDialog;
