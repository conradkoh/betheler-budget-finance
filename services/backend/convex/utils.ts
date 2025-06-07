/**
 * Utility functions for the Convex backend
 */

/**
 * Get the first day of a month at 00:00:00.000 in the user's specified timezone (defaults to UTC if not provided)
 * @param year The full year (e.g., 2023)
 * @param month The month (0-based, 0 = January, 11 = December)
 * @param timezoneOffsetMinutes Optional timezone offset in minutes from UTC (e.g., -420 for PST)
 * @returns Date object set to the first day of the month at 00:00:00.000 in the specified timezone
 */
export function getMonthStartDate(
  year: number,
  month: number,
  timezoneOffsetMinutes?: number
): Date {
  // Create a date in UTC first for the first day of the month
  const date = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // If timezone offset is provided, adjust the date
  // Note: getTimezoneOffset returns the offset from local to UTC (opposite of what we need)
  // For example, PST returns +480, meaning PST is 8 hours behind UTC
  // We need to SUBTRACT this offset to convert from local time to UTC
  if (timezoneOffsetMinutes !== undefined) {
    date.setUTCMinutes(date.getUTCMinutes() + timezoneOffsetMinutes);
  }

  return date;
}

/**
 * Get the last day of a month at 23:59:59.999 in the user's specified timezone (defaults to UTC if not provided)
 * @param year The full year (e.g., 2023)
 * @param month The month (0-based, 0 = January, 11 = December)
 * @param timezoneOffsetMinutes Optional timezone offset in minutes from UTC (e.g., -420 for PST)
 * @returns Date object set to the last day of the month at 23:59:59.999 in the specified timezone
 */
export function getMonthEndDate(year: number, month: number, timezoneOffsetMinutes?: number): Date {
  // Calculate the last day of the month
  // To get the last day, we take the first day of the next month and subtract 1 millisecond
  const nextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

  // If timezone offset is provided, adjust the date
  if (timezoneOffsetMinutes !== undefined) {
    nextMonth.setUTCMinutes(nextMonth.getUTCMinutes() + timezoneOffsetMinutes);
  }

  // Subtract 1 millisecond to get the end of the previous month
  nextMonth.setUTCMilliseconds(nextMonth.getUTCMilliseconds() - 1);

  return nextMonth;
}

/**
 * Get the ISO string representation for the start of a month
 * @param year The full year (e.g., 2023)
 * @param month The month (0-based, 0 = January, 11 = December)
 * @param timezoneOffsetMinutes Optional timezone offset in minutes (from client)
 * @returns ISO string for the first millisecond of the month in the specified timezone
 */
export function getMonthStartDateISO(
  year: number,
  month: number,
  timezoneOffsetMinutes?: number
): string {
  return getMonthStartDate(year, month, timezoneOffsetMinutes).toISOString();
}

/**
 * Get the ISO string representation for the end of a month
 * @param year The full year (e.g., 2023)
 * @param month The month (0-based, 0 = January, 11 = December)
 * @param timezoneOffsetMinutes Optional timezone offset in minutes (from client)
 * @returns ISO string for the last millisecond of the month in the specified timezone
 */
export function getMonthEndDateISO(
  year: number,
  month: number,
  timezoneOffsetMinutes?: number
): string {
  return getMonthEndDate(year, month, timezoneOffsetMinutes).toISOString();
}

/**
 * Create date range object with start and end dates for a month
 * @param year The full year (e.g., 2023)
 * @param month The month (0-based, 0 = January, 11 = December)
 * @param timezoneOffsetMinutes Optional timezone offset in minutes (from client)
 * @returns Object with startDate, endDate, startDateISO, and endDateISO
 */
export function getMonthDateRange(
  year: number,
  month: number,
  timezoneOffsetMinutes: number
): {
  startDate: Date;
  endDate: Date;
  startDateISO: string;
  endDateISO: string;
} {
  const startDate = getMonthStartDate(year, month, timezoneOffsetMinutes);
  const endDate = getMonthEndDate(year, month, timezoneOffsetMinutes);

  return {
    startDate,
    endDate,
    startDateISO: startDate.toISOString(),
    endDateISO: endDate.toISOString(),
  };
}

/**
 * Create date range object with arbitrary start and end dates, adjusting for timezone
 * @param startDateISO ISO string for the start date
 * @param endDateISO ISO string for the end date
 * @param timezoneOffsetMinutes Optional timezone offset in minutes (from client)
 * @returns Object with startDate, endDate, startDateISO, and endDateISO adjusted for timezone
 */
export function getDateRange(
  startDateISO: string,
  endDateISO: string,
  timezoneOffsetMinutes: number
): {
  startDate: Date;
  endDate: Date;
  startDateISO: string;
  endDateISO: string;
} {
  // Parse the input dates
  const startDate = new Date(startDateISO);
  const endDate = new Date(endDateISO);

  // Adjust for timezone if provided
  if (timezoneOffsetMinutes !== undefined) {
    startDate.setUTCMinutes(startDate.getUTCMinutes() + timezoneOffsetMinutes);
    endDate.setUTCMinutes(endDate.getUTCMinutes() + timezoneOffsetMinutes);
  }

  // Set start date to beginning of day (00:00:00.000)
  startDate.setUTCHours(0, 0, 0, 0);

  // Set end date to end of day (23:59:59.999)
  endDate.setUTCHours(23, 59, 59, 999);

  return {
    startDate,
    endDate,
    startDateISO: startDate.toISOString(),
    endDateISO: endDate.toISOString(),
  };
}
