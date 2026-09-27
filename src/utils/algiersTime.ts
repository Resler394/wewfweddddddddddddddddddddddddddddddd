/**
 * ============================================================================
 * VENTY TIMEZONE UTILITY — AFRICA/ALGIERS (UTC+1)
 * ============================================================================
 * All VENTY business dates, "Today" / "Yesterday" / Weekly / Monthly boundaries,
 * and order timestamps are formatted and grouped strictly in the `Africa/Algiers`
 * timezone, never using the browser's local timezone.
 */

export const VENTY_TIMEZONE = 'Africa/Algiers';

export type OrderDateFilter = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL';

/**
 * Returns YYYY-MM-DD in Africa/Algiers timezone for any Date or ISO string.
 */
export const getAlgiersDateKey = (dateInput: string | number | Date = new Date()): string => {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    // en-CA reliably formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: VENTY_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
};

/**
 * Returns YYYY-MM in Africa/Algiers timezone.
 */
export const getAlgiersMonthKey = (dateInput: string | number | Date = new Date()): string => {
  const key = getAlgiersDateKey(dateInput);
  return key ? key.slice(0, 7) : '';
};

/**
 * Formats an ISO timestamp as a human-readable date in Africa/Algiers:
 * e.g. "September 26, 2026"
 */
export const formatAlgiersDate = (dateInput: string | number | Date = new Date()): string => {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: VENTY_TIMEZONE,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateInput);
  }
};

/**
 * Formats an ISO timestamp as 24-hour HH:mm in Africa/Algiers:
 * e.g. "19:42"
 */
export const formatAlgiersTime = (dateInput: string | number | Date = new Date()): string => {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: VENTY_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '';
  }
};

/**
 * Formats an ISO timestamp as "September 26, 2026 · 19:42" in Africa/Algiers.
 */
export const formatAlgiersDateTime = (dateInput: string | number | Date): string => {
  const d = formatAlgiersDate(dateInput);
  const t = formatAlgiersTime(dateInput);
  return t ? `${d} · ${t}` : d;
};

/**
 * Computes date keys for Today, Yesterday, and the last 7 days in Africa/Algiers.
 */
export const getAlgiersBusinessBoundaries = (referenceNow: Date = new Date()) => {
  const todayKey = getAlgiersDateKey(referenceNow);
  const currentMonthKey = todayKey.slice(0, 7);

  // Parse YYYY-MM-DD components of today in Algiers to step backward by calendar days safely
  const [y, m, d] = todayKey.split('-').map(Number);
  const utcNoon = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));

  const yesterdayDate = new Date(utcNoon.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = getAlgiersDateKey(yesterdayDate);

  const weekKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(utcNoon.getTime() - i * 24 * 60 * 60 * 1000);
    weekKeys.add(getAlgiersDateKey(dayDate));
  }

  return {
    todayKey,
    todayLabel: formatAlgiersDate(referenceNow),
    yesterdayKey,
    yesterdayLabel: formatAlgiersDate(yesterdayDate),
    currentMonthKey,
    weekKeys,
  };
};

/**
 * Checks whether an order's createdAt timestamp falls within the requested Africa/Algiers business period.
 */
export const matchesAlgiersDateFilter = (
  createdAtIso: string,
  filter: OrderDateFilter,
  referenceNow: Date = new Date(),
): boolean => {
  if (filter === 'ALL') return true;
  const orderDateKey = getAlgiersDateKey(createdAtIso);
  if (!orderDateKey) return false;

  const boundaries = getAlgiersBusinessBoundaries(referenceNow);

  switch (filter) {
    case 'TODAY':
      return orderDateKey === boundaries.todayKey;
    case 'YESTERDAY':
      return orderDateKey === boundaries.yesterdayKey;
    case 'THIS_WEEK':
      return boundaries.weekKeys.has(orderDateKey);
    case 'THIS_MONTH':
      return orderDateKey.startsWith(boundaries.currentMonthKey);
    default:
      return true;
  }
};
