/**
 * TypeScript interfaces for Reports page
 * Provides type safety for all report data structures
 */

export interface ReportMetrics {
  // Core metrics
  total_revenue: number;
  total_events: number;
  total_attendees: number;
  total_tickets_sold: number;
  
  // Performance metrics
  check_in_rate: number;
  checked_in_attendees: number;
  no_shows: number;
  conversion_rate: number;
  
  // Financial metrics
  average_revenue_per_event: number;
  average_ticket_price: number;
  average_attendees_per_event: number;
  
  // Attendee metrics
  new_attendees: number;
  returning_attendees: number;
  returning_attendees_percentage: number;
  unique_attendees: number;
  
  // Breakdowns (Record format from API)
  top_events_by_attendance: Record<string, number>;
  guest_type_breakdown: Record<string, number>;
  revenue_by_event_type: Record<string, number>;
  tickets_by_type: Record<string, { sold: number; revenue: number }>;
  revenue_timeline: Record<string, number>;
  age_group_breakdown: Record<string, number>;
  registrations_by_month: Record<string, number>;
  daily_check_ins: Record<string, number>;
  peak_check_in_hour: Record<string, number>;
  events_by_month: Record<string, number>;
  registration_timeline: Record<string, number>;
  event_type_breakdown: Record<string, number>;
  country_breakdown: Record<string, number>;
  gender_breakdown: Record<string, number>;
}

export interface TopEvent {
  name: string;
  attendees: number;
  revenue?: number;
  satisfaction?: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimelineDataPoint {
  date: string;
  revenue?: number;
  attendees?: number;
  registrations?: number;
  checkIns?: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

export interface Event {
  id: number;
  name: string;
  price: number | string;
  [key: string]: unknown;
}

export interface ReportSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface LoadingState {
  metrics: boolean;
  charts: boolean;
  demographics: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

export const DEFAULT_VISIBLE_REPORTS = [
  'executive',
  'performance',
  'financial',
  'attendee',
  'engagement',
  'revenue',
  'demographics'
] as const;

export type ReportSectionId = typeof DEFAULT_VISIBLE_REPORTS[number];




















