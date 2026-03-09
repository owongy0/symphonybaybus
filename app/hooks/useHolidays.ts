'use client';

import { useState, useEffect } from 'react';
import { Holiday } from '../lib/schedule-types';
import { 
  fetchHolidays, 
  getCachedHolidays, 
  shouldRefreshHolidays,
  getHolidaySet,
  getHolidayForDate
} from '../lib/holidays';

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load cached holidays first
    const cached = getCachedHolidays();
    if (cached.length > 0) {
      setHolidays(cached);
      setIsLoading(false);
    }
    
    // Refresh if needed
    if (shouldRefreshHolidays()) {
      fetchHolidays().then(fresh => {
        if (fresh.length > 0) {
          setHolidays(fresh);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const holidaySet = getHolidaySet(holidays);
  
  const getHolidayForDateFn = (date: Date) => {
    return getHolidayForDate(date, holidays);
  };
  
  return { holidays, holidaySet, isLoading, getHolidayForDate: getHolidayForDateFn };
}
