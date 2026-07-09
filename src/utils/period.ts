import { DailyRecord } from '../types';

// Format Date object to YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD to Date object safely
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Calculate difference in days between two YYYY-MM-DD strings
export function getDaysDiff(date1: string, date2: string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Add days to a YYYY-MM-DD string and return YYYY-MM-DD
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Identify period start dates from all records.
 * Group consecutive days where period was active as a single period session.
 * Returns an array of start dates, sorted in ascending order.
 */
export function getPeriodSessions(records: DailyRecord[]): { start: string; end: string; length: number }[] {
  // Filter and sort records where period is active
  const activeDates = records
    .filter((r) => r.period && r.period.active)
    .map((r) => r.date)
    .sort();

  if (activeDates.length === 0) return [];

  const sessions: { start: string; end: string; length: number }[] = [];
  let currentStart = activeDates[0];
  let currentEnd = activeDates[0];

  for (let i = 1; i < activeDates.length; i++) {
    const prev = activeDates[i - 1];
    const curr = activeDates[i];
    const diff = getDaysDiff(prev, curr);

    // If consecutive or within 2 days, group them (some users might miss logging one day)
    if (diff <= 2) {
      currentEnd = curr;
    } else {
      sessions.push({
        start: currentStart,
        end: currentEnd,
        length: getDaysDiff(currentStart, currentEnd) + 1,
      });
      currentStart = curr;
      currentEnd = curr;
    }
  }

  // Push last session
  sessions.push({
    start: currentStart,
    end: currentEnd,
    length: getDaysDiff(currentStart, currentEnd) + 1,
  });

  return sessions;
}

export interface PeriodPrediction {
  averageCycle: number;
  averageLength: number;
  lastStartDate: string | null;
  nextPredictedDate: string | null;
  dDay: number | null;
  isCurrentlyActive: boolean;
  currentDayNum: number | null;
}

/**
 * Analyzes period history and predicts the next period.
 */
export function predictPeriod(records: DailyRecord[], todayStr: string): PeriodPrediction {
  const sessions = getPeriodSessions(records);

  // Check if today is active
  const todayRecord = records.find((r) => r.date === todayStr);
  const isCurrentlyActive = !!(todayRecord && todayRecord.period && todayRecord.period.active);

  let currentDayNum: number | null = null;
  if (isCurrentlyActive && sessions.length > 0) {
    // Find the session that covers today
    const currentSession = sessions.find(
      (s) => todayStr >= s.start && todayStr <= s.end
    );
    if (currentSession) {
      currentDayNum = getDaysDiff(currentSession.start, todayStr) + 1;
    } else {
      // Fallback: days since the last start date that is before or equal to today
      const pastStarts = sessions
        .map((s) => s.start)
        .filter((start) => start <= todayStr)
        .sort();
      if (pastStarts.length > 0) {
        currentDayNum = getDaysDiff(pastStarts[pastStarts.length - 1], todayStr) + 1;
      }
    }
  }

  if (sessions.length === 0) {
    return {
      averageCycle: 28,
      averageLength: 5,
      lastStartDate: null,
      nextPredictedDate: null,
      dDay: null,
      isCurrentlyActive: false,
      currentDayNum: null,
    };
  }

  // Calculate average length of period
  const totalLength = sessions.reduce((acc, s) => acc + s.length, 0);
  const averageLength = Math.round((totalLength / sessions.length) * 10) / 10 || 5;

  // Calculate average cycle (gap between starts)
  let averageCycle = 28; // Default fallback
  if (sessions.length > 1) {
    let totalCycleDays = 0;
    for (let i = 1; i < sessions.length; i++) {
      totalCycleDays += getDaysDiff(sessions[i - 1].start, sessions[i].start);
    }
    averageCycle = Math.round(totalCycleDays / (sessions.length - 1));
  }

  // Next prediction is based on the absolute latest session's start date
  const lastSession = sessions[sessions.length - 1];
  const lastStartDate = lastSession.start;
  const nextPredictedDate = addDays(lastStartDate, averageCycle);

  // D-Day calculation
  const tDate = parseDate(todayStr);
  const pDate = parseDate(nextPredictedDate);
  const diffTime = pDate.getTime() - tDate.getTime();
  const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    averageCycle,
    averageLength,
    lastStartDate,
    nextPredictedDate,
    dDay,
    isCurrentlyActive,
    currentDayNum,
  };
}
