/**
 * Date utility functions for expense management.
 *
 * Will be fully implemented during feature development.
 */

/**
 * Get the start and end dates for a given year and month.
 * Returns exclusive end (first instant of next month) for use with `< end` queries.
 */
export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01T00:00:00.000Z`;
  // Exclusive end: first instant of next month
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${pad(nextMonth)}-01T00:00:00.000Z`;
  return { start, end };
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
