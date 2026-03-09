'use client';

import { Holiday } from './schedule-types';

const CACHE_KEY = 'hk_holidays';
const CACHE_DATE_KEY = 'hk_holidays_last_fetch';

// Hardcoded 2026 holidays as fallback
const FALLBACK_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', nameEn: "New Year's Day", nameZh: '元旦' },
  { date: '2026-02-17', nameEn: 'Lunar New Year', nameZh: '農曆新年' },
  { date: '2026-02-18', nameEn: '2nd Day of Lunar New Year', nameZh: '農曆新年初二' },
  { date: '2026-02-19', nameEn: '3rd Day of Lunar New Year', nameZh: '農曆新年初三' },
  { date: '2026-04-04', nameEn: 'Ching Ming Festival', nameZh: '清明節' },
  { date: '2026-04-03', nameEn: 'Good Friday', nameZh: '耶穌受難節' },
  { date: '2026-04-04', nameEn: 'Day after Good Friday', nameZh: '耶穌受難節翌日' },
  { date: '2026-04-06', nameEn: 'Easter Monday', nameZh: '復活節星期一' },
  { date: '2026-05-01', nameEn: 'Labour Day', nameZh: '勞動節' },
  { date: '2026-05-25', nameEn: "Buddha's Birthday", nameZh: '佛誕' },
  { date: '2026-06-19', nameEn: 'Tuen Ng Festival', nameZh: '端午節' },
  { date: '2026-07-01', nameEn: 'HKSAR Day', nameZh: '香港特區成立紀念日' },
  { date: '2026-10-01', nameEn: 'National Day', nameZh: '國慶日' },
  { date: '2026-09-25', nameEn: 'Mid-Autumn Festival', nameZh: '中秋節翌日' },
  { date: '2026-10-18', nameEn: 'Chung Yeung Festival', nameZh: '重陽節' },
  { date: '2026-12-25', nameEn: 'Christmas', nameZh: '聖誕節' },
  { date: '2026-12-26', nameEn: 'Boxing Day', nameZh: '聖誕節翌日' },
];

// Parse iCal data to extract holidays
export function parseICal(data: string): Holiday[] {
  const holidays: Holiday[] = [];
  const lines = data.split(/\r?\n/);
  
  let inEvent = false;
  let currentEvent: Partial<Holiday> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.date && currentEvent.nameEn) {
        holidays.push({
          date: currentEvent.date,
          nameEn: currentEvent.nameEn,
          nameZh: currentEvent.nameZh || currentEvent.nameEn,
        });
      }
    } else if (inEvent) {
      if (trimmed.startsWith('DTSTART;VALUE=DATE:')) {
        const dateStr = trimmed.substring('DTSTART;VALUE=DATE:'.length);
        if (dateStr.length === 8) {
          currentEvent.date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
      } else if (trimmed.startsWith('SUMMARY:')) {
        const summary = trimmed.substring('SUMMARY:'.length);
        currentEvent.nameEn = summary.trim();
      }
    }
  }
  
  return holidays;
}

// Fetch holidays - uses fallback if API fails
export async function fetchHolidays(): Promise<Holiday[]> {
  try {
    // Try local API route first
    const response = await fetch('/api/holidays');
    if (response.ok) {
      const data = await response.json();
      if (data.holidays && data.holidays.length > 0) {
        // Cache successful fetch
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.holidays));
          localStorage.setItem(CACHE_DATE_KEY, new Date().toISOString());
        }
        return data.holidays;
      }
    }
  } catch (error) {
    console.log('API fetch failed, using fallback');
  }
  
  // Return fallback holidays for 2026
  return FALLBACK_HOLIDAYS_2026;
}

// Get cached holidays
export function getCachedHolidays(): Holiday[] {
  if (typeof window === 'undefined') return FALLBACK_HOLIDAYS_2026;
  
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return FALLBACK_HOLIDAYS_2026;
    }
  }
  
  return FALLBACK_HOLIDAYS_2026;
}

// Check if we need to refresh holidays (older than 7 days)
export function shouldRefreshHolidays(): boolean {
  if (typeof window === 'undefined') return true;
  
  const lastFetch = localStorage.getItem(CACHE_DATE_KEY);
  if (!lastFetch) return true;
  
  const lastFetchDate = new Date(lastFetch);
  const now = new Date();
  const daysSinceFetch = (now.getTime() - lastFetchDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceFetch > 7;
}

// Create a Set of holiday dates for efficient lookup
export function getHolidaySet(holidays: Holiday[]): Set<string> {
  return new Set(holidays.map(h => h.date));
}

// Get holiday name for a specific date
export function getHolidayForDate(date: Date, holidays: Holiday[]): Holiday | null {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.find(h => h.date === dateStr) || null;
}
