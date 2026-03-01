/**
 * Date utility functions for expense management.
 *
 * All date ranges use SGT (UTC+8) for consistency with Singapore timezone.
 */

import { SGT_OFFSET } from '@/lib/constants';

/**
 * Get the start and end dates for a given year and month.
 * Returns exclusive end (first instant of next month) for use with `< end` queries.
 * Uses SGT offset for consistency with transaction dates.
 */
export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01T00:00:00${SGT_OFFSET}`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${pad(nextMonth)}-01T00:00:00${SGT_OFFSET}`;
  return { start, end };
}

/**
 * Get the start and end dates for an ISO week number within a year.
 * ISO week 1 = week containing the first Thursday of the year.
 * Returns exclusive end (Monday 00:00 of the following week).
 */
export function getWeekDateRange(year: number, week: number): { start: string; end: string } {
  // Find Jan 4 (always in ISO week 1) and compute the Monday of that week
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // ISO: Monday=1, Sunday=7
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1));

  // Add (week - 1) * 7 days to get Monday of target week
  const startDate = new Date(mondayOfWeek1);
  startDate.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 7);

  const pad = (n: number) => String(n).padStart(2, '0');
  const toSgtString = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T00:00:00${SGT_OFFSET}`;

  return { start: toSgtString(startDate), end: toSgtString(endDate) };
}

/**
 * Get the start and end dates for an entire year.
 * Returns exclusive end (Jan 1 of the following year).
 */
export function getYearDateRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01T00:00:00${SGT_OFFSET}`,
    end: `${year + 1}-01-01T00:00:00${SGT_OFFSET}`,
  };
}

/**
 * Extract just the date portion (YYYY-MM-DD) from an ISO datetime string.
 */
export function extractDateOnly(dateString: string): string {
  return dateString.slice(0, 10);
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the current year and month.
 */
export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
