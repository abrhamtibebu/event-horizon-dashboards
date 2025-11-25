/**
 * Utility functions for transforming report data
 * Centralizes data transformation logic for reusability and testing
 */

import { ReportMetrics, TopEvent, PieChartData, TimelineDataPoint, BarChartData } from '@/types/reports';

/**
 * Helper function to get HSL values from CSS variables
 */
const getHSL = (varName: string, fallback: string): string => {
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(varName).trim();
  if (!value) return fallback;
  if (value.startsWith('hsl(')) return value;
  if (value.match(/^\d+\s+\d+%\s+\d+%$/)) return `hsl(${value})`;
  return `hsl(${value})`;
};

/**
 * Get theme-aware chart colors using CSS variables
 */
export const getChartColors = () => {
  return {
    primary: getHSL('--chart-1', 'hsl(195 67% 29%)'),
    secondary: getHSL('--chart-2', 'hsl(134 28% 72%)'),
    accent: getHSL('--chart-3', 'hsl(41 100% 61%)'),
    warning: getHSL('--chart-4', 'hsl(54 94% 51%)'),
    error: getHSL('--chart-5', 'hsl(0 61% 56%)'),
    success: getHSL('--color-success', 'hsl(134 28% 72%)'),
    info: getHSL('--color-info', 'hsl(195 67% 29%)'),
    line: getHSL('--chart-line', 'hsl(194 67% 29%)'), // Line chart color - #18637b light, #8dbf98 dark
  };
};

/**
 * Get theme-aware chart color palettes using CSS variables
 * These functions return colors that adapt to the current theme
 */
export const getChartColorPalette = (paletteType: 'primary' | 'revenue' | 'tickets' | 'age' | 'hours' = 'primary'): string[] => {
  const colors = getChartColors();
  
  const palettes = {
    primary: [
      colors.info,           // Blue Sapphire
      colors.secondary,      // Eton Blue  
      colors.accent,         // Honey Yellow
      colors.warning,        // Safety Yellow
      colors.error,          // Red
      colors.success,        // Eton Blue (alternate)
      colors.primary,        // Blue Sapphire (alternate)
      colors.accent,         // Honey Yellow (alternate)
    ],
    revenue: [
      colors.success,        // Eton Blue (greenish)
      colors.info,           // Blue Sapphire
      colors.accent,         // Honey Yellow
      colors.warning,        // Safety Yellow
      colors.error,          // Red
      colors.secondary,      // Eton Blue
    ],
    tickets: [
      colors.info,           // Blue Sapphire
      colors.accent,         // Honey Yellow
      colors.primary,        // Blue Sapphire (alternate)
      colors.success,        // Eton Blue
      colors.warning,        // Safety Yellow
      colors.error,          // Red
    ],
    age: [
      colors.info,           // Blue Sapphire
      colors.accent,         // Honey Yellow
      colors.success,        // Eton Blue
      colors.warning,        // Safety Yellow
      colors.error,          // Red
      getHSL('--muted-foreground', 'hsl(215.4 16.3% 46.9%)'), // Gray
    ],
    hours: [
      colors.success,        // Eton Blue
      colors.info,           // Blue Sapphire
      colors.accent,         // Honey Yellow
      colors.warning,        // Safety Yellow
      colors.error,          // Red
    ],
  };
  
  return palettes[paletteType] || palettes.primary;
};

// Legacy constant for backward compatibility - now uses theme-aware function
export const CHART_COLORS = {
  get primary() { return getChartColorPalette('primary'); },
  get revenue() { return getChartColorPalette('revenue'); },
  get tickets() { return getChartColorPalette('tickets'); },
  get age() { return getChartColorPalette('age'); },
  get hours() { return getChartColorPalette('hours'); },
} as const;

/**
 * Transform top events data
 */
export const transformTopEvents = (
  data: Record<string, number>,
  eventIdToName: Record<string, string>
): TopEvent[] => {
  return Object.entries(data)
    .map(([eventId, attendees]) => ({
      name: eventIdToName[eventId] || `Event #${eventId}`,
      attendees: typeof attendees === 'number' ? attendees : 0,
    }))
    .sort((a, b) => b.attendees - a.attendees)
    .slice(0, 10); // Top 10 only
};

/**
 * Transform record data to pie chart format
 */
export const transformToPieChart = (
  data: Record<string, number>,
  colorPalette: readonly string[] = CHART_COLORS.primary
): PieChartData[] => {
  return Object.entries(data)
    .filter(([_, value]) => value > 0) // Filter out zero values
    .map(([name, value], i) => ({
      name,
      value: typeof value === 'number' ? value : 0,
      color: colorPalette[i % colorPalette.length],
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
};

/**
 * Transform record data to bar chart format
 */
export const transformToBarChart = (
  data: Record<string, number>,
  colorPalette: readonly string[] = CHART_COLORS.primary
): BarChartData[] => {
  return Object.entries(data)
    .map(([name, value], i) => ({
      name,
      value: typeof value === 'number' ? value : 0,
      color: colorPalette[i % colorPalette.length],
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Transform tickets by type data
 */
export const transformTicketsByType = (
  data: Record<string, { sold: number; revenue: number }>,
  colorPalette: readonly string[] = CHART_COLORS.tickets
): Array<PieChartData & { revenue: number }> => {
  return Object.entries(data)
    .map(([name, data], i) => ({
      name,
      value: typeof data.sold === 'number' ? data.sold : 0,
      revenue: typeof data.revenue === 'number' ? data.revenue : 0,
      color: colorPalette[i % colorPalette.length],
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
};

/**
 * Transform timeline data
 */
export const transformTimeline = (
  data: Record<string, number>,
  dataKey: 'revenue' | 'attendees' | 'registrations' | 'checkIns' = 'revenue'
): TimelineDataPoint[] => {
  return Object.entries(data)
    .map(([date, value]) => ({
      date,
      [dataKey]: typeof value === 'number' ? value : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Format date for display
 */
export const formatChartDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Format as "MMM dd, yyyy" or "MMM yyyy" for months
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      // Month format (YYYY-MM)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  return `${currency} ${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Safe localStorage getter with error handling
 */
export const safeGetLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    return parsed as T;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Safe localStorage setter with error handling
 */
export const safeSetLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

/**
 * Get chart styles based on theme using CSS variables
 */
export const getChartStyles = () => {
  return {
    tooltipBg: getHSL('--card', 'hsl(0 0% 100%)'),
    tooltipBorder: getHSL('--border', 'hsl(214.3 31.8% 91.4%)'),
    tooltipText: getHSL('--card-foreground', 'hsl(200 100% 2%)'),
    gridStroke: getHSL('--chart-grid', getHSL('--border', 'hsl(214.3 31.8% 91.4%)')),
    axisStroke: getHSL('--chart-axis', getHSL('--muted-foreground', 'hsl(215.4 16.3% 46.9%)')),
    labelColor: getHSL('--foreground', 'hsl(200 100% 2%)'),
    background: getHSL('--background', 'hsl(0 0% 100%)'),
  };
};

