import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { applyEventBannerFallback, cn, getEventBannerUrl } from '@/lib/utils';

interface EventContextCardProps {
  eventName: string;
  imageUrl?: string | null;
  eventId?: number | string;
  startDate?: Date | null;
  location?: string | null;
  className?: string;
}

export function EventContextCard({
  eventName,
  imageUrl,
  startDate,
  location,
  className,
}: EventContextCardProps) {
  const src = getEventBannerUrl(imageUrl);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border/40 bg-card/50',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 w-full shrink-0 sm:h-auto sm:w-52">
          <img
            src={src}
            alt={eventName}
            className="h-full w-full object-cover"
            loading="eager"
            onError={(e) => applyEventBannerFallback(e.currentTarget)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent sm:bg-gradient-to-r" />
        </div>

        <div className="min-w-0 flex-1 space-y-3 p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            You're buying tickets for
          </p>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
            {eventName}
          </h1>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {startDate && (
              <p className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                {format(startDate, 'EEEE, MMM d · h:mm a')}
              </p>
            )}
            {location && (
              <p className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2">{location}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
