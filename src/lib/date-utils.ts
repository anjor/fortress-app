// Date utility functions for Fortress

/**
 * Check if two dates are in the same month and year (ignoring day/time)
 */
export function isSameMonth(date1: Date | undefined, date2: Date | undefined): boolean {
  if (!date1 || !date2) return false;

  // Handle invalid dates
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * Format date for display: "Dec 2025"
 * Consistent with UK locale used elsewhere in the app
 */
export function formatMonthYear(date: Date | undefined): string {
  if (!date) return 'Unknown';

  // Handle invalid dates
  if (isNaN(date.getTime())) return 'Unknown';

  return new Date(date).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}
