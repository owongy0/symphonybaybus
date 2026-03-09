import { 
  BusDeparture, 
  NextBusResult, 
  DayType, 
  Estate, 
  LocationCode, 
  JourneyOption,
  ScheduleData,
  LOCATION_NAMES,
  Language
} from './schedule-types';
import { getSchedule, DEFAULT_RUNTIMES } from './schedule-data';

// Convert time string (HH:MM) to minutes since midnight
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Format minutes to HH:MM
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get current time in minutes
export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

// Determine if a date is a weekday (not weekend, not holiday)
export function isWeekday(date: Date, holidays: Set<string>): boolean {
  const day = date.getDay();
  const dateStr = formatDateKey(date);
  return day !== 0 && day !== 6 && !holidays.has(dateStr);
}

// Format date as YYYY-MM-DD
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get day type for schedule selection
export function getDayType(date: Date, holidays: Set<string>): DayType {
  return isWeekday(date, holidays) ? 'weekday' : 'weekend';
}

// Get the next bus for a specific route
export function getNextBus(
  routeKey: string,
  estate: Estate,
  dayType: DayType,
  currentTimeMinutes: number
): NextBusResult | null {
  const schedule = getSchedule(estate);
  const route = schedule[routeKey];
  
  if (!route) return null;
  
  const departures = route[dayType];
  if (!departures || departures.length === 0) return null;
  
  // Find next departure
  let nextIndex = -1;
  let prevIndex = -1;
  
  for (let i = 0; i < departures.length; i++) {
    const depMins = timeToMinutes(departures[i].time);
    if (depMins > currentTimeMinutes) {
      nextIndex = i;
      prevIndex = i > 0 ? i - 1 : departures.length - 1;
      break;
    }
  }
  
  // If no next bus found today, first bus tomorrow
  const isTomorrow = nextIndex === -1;
  if (isTomorrow) {
    nextIndex = 0;
    prevIndex = departures.length - 1;
  }
  
  const nextDep = departures[nextIndex];
  const prevDep = departures[prevIndex];
  const nextMins = timeToMinutes(nextDep.time);
  const prevMins = timeToMinutes(prevDep.time);
  
  // Calculate time until next bus
  let minutesUntil: number;
  if (isTomorrow) {
    minutesUntil = (24 * 60 - currentTimeMinutes) + nextMins;
  } else {
    minutesUntil = nextMins - currentTimeMinutes;
  }
  
  // Calculate progress between buses
  let totalInterval: number;
  let elapsed: number;
  
  if (isTomorrow) {
    totalInterval = (24 * 60 - prevMins) + nextMins;
    elapsed = currentTimeMinutes - prevMins;
    if (elapsed < 0) elapsed += 24 * 60;
  } else if (prevMins < nextMins) {
    totalInterval = nextMins - prevMins;
    elapsed = currentTimeMinutes - prevMins;
  } else {
    // Wrapped around midnight
    totalInterval = nextMins + (24 * 60 - prevMins);
    elapsed = currentTimeMinutes - prevMins;
    if (elapsed < 0) elapsed += 24 * 60;
  }
  
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalInterval) * 100));
  
  return {
    departure: nextDep,
    previousDeparture: prevDep,
    minutesUntil,
    progressPercent,
    isTomorrow,
  };
}

// Format duration for display
export function formatDuration(minutes: number, lang: 'en' | 'zh'): string {
  const totalMins = Math.floor(minutes);
  const secs = Math.floor((minutes - totalMins) * 60);
  
  if (totalMins < 60) {
    if (lang === 'zh') {
      return `${totalMins}分${secs}秒`;
    }
    return `${totalMins}m ${secs}s`;
  }
  
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  
  if (lang === 'zh') {
    return `${hrs}小時${mins}分`;
  }
  return `${hrs}h ${mins}m`;
}

// Get route key for origin-destination pair
export function getRouteKey(origin: LocationCode, dest: LocationCode, estate: Estate): string | null {
  // Main routes
  if (origin === 'ntp' && dest === 'vr') return 'ntp-vr';
  if (origin === 'vr' && dest === 'ntp') return 'vr-ntp';
  if (origin === 'ntp' && dest === 'vc') return 'ntp-vc';
  if (origin === 'vc' && dest === 'ntp') return 'vc-ntp';
  
  // Short routes (Ma On Shan / Sunshine City)
  if (origin === 'sc' && dest === 'vr') return 'mos-vr';
  if (origin === 'vr' && dest === 'sc') return 'vr-mos';
  if (origin === 'sc' && dest === 'vc') return 'mos-vc';
  if (origin === 'vc' && dest === 'sc') return 'vc-mos';
  
  // NTP to SC and SC to NTP only via special evening services
  if ((origin === 'ntp' && dest === 'sc') || (origin === 'sc' && dest === 'ntp')) {
    return estate === 'vr' ? (origin === 'ntp' ? 'ntp-vr' : 'vr-ntp') : 
                              (origin === 'ntp' ? 'ntp-vc' : 'vc-ntp');
  }
  
  // Inter-estate not official NR524 service
  return null;
}

// Get via location for a route
export function getViaLocation(origin: LocationCode, dest: LocationCode): LocationCode | null {
  // Note: Inter-estate via is not official NR524 service
  // Only showing via for informational purposes on main routes
  if ((origin === 'sc' && dest === 'vr') || (origin === 'vr' && dest === 'sc')) return 'vc';
  if ((origin === 'sc' && dest === 'vc') || (origin === 'vc' && dest === 'sc')) return null;
  return null;
}

// Calculate journey time between two locations
export function calculateJourneyTime(
  origin: LocationCode,
  dest: LocationCode,
  isStandard: boolean
): number {
  // Main routes (NTP <-> Estates)
  if ((origin === 'ntp' && dest === 'vr') || (origin === 'vr' && dest === 'ntp')) {
    return DEFAULT_RUNTIMES.regular['ntp-vr'];
  }
  
  if ((origin === 'ntp' && dest === 'vc') || (origin === 'vc' && dest === 'ntp')) {
    // NTP to VC is via VR in reality, but same runtime as NTP-VR
    return DEFAULT_RUNTIMES.regular['ntp-vr'];
  }
  
  // Short routes (Sunshine City <-> Estates)
  if ((origin === 'sc' && dest === 'vr') || (origin === 'vr' && dest === 'sc')) {
    return isStandard ? DEFAULT_RUNTIMES.regular['sc-vr'] : DEFAULT_RUNTIMES.special['sc-vr'];
  }
  
  if ((origin === 'sc' && dest === 'vc') || (origin === 'vc' && dest === 'sc')) {
    return isStandard ? DEFAULT_RUNTIMES.regular['sc-vc'] : DEFAULT_RUNTIMES.special['sc-vc'];
  }
  
  // NTP <-> SC (only via special evening services)
  if ((origin === 'ntp' && dest === 'sc') || (origin === 'sc' && dest === 'ntp')) {
    return DEFAULT_RUNTIMES.special[origin === 'ntp' ? 'ntp-sc' : 'sc-ntp'];
  }
  
  // Inter-estate not official - fallback estimate
  if ((origin === 'vr' && dest === 'vc') || (origin === 'vc' && dest === 'vr')) {
    return 5; // Estimated walking/shuttle time
  }
  
  return 15; // Default
}

// Find journey options for "arrive by" query
export function findJourneysArriveBy(
  origin: LocationCode,
  dest: LocationCode,
  arriveByMinutes: number,
  dayType: DayType,
  estate: Estate
): JourneyOption[] {
  const results: JourneyOption[] = [];
  const routeKey = getRouteKey(origin, dest, estate);
  
  if (!routeKey) return results;
  
  const schedule = getSchedule(estate);
  const route = schedule[routeKey];
  if (!route) return results;
  
  const departures = route[dayType];
  const via = getViaLocation(origin, dest);
  
  for (const dep of departures) {
    const depMins = timeToMinutes(dep.time);
    const journeyTime = calculateJourneyTime(origin, dest, dep.isStandard);
    const arriveMins = depMins + journeyTime;
    
    if (arriveMins <= arriveByMinutes) {
      const minutesEarly = arriveByMinutes - arriveMins;
      
      // Skip if arriving more than 60 minutes early (increased from 30)
      if (minutesEarly > 60) continue;
      
      // Calculate via time if applicable
      let viaTime: string | undefined;
      if (via) {
        const viaJourneyTime = calculateJourneyTime(origin, via, dep.isStandard);
        viaTime = minutesToTime(depMins + viaJourneyTime);
      }
      
      results.push({
        departTime: dep.time,
        arriveTime: minutesToTime(arriveMins),
        journeyTimeMinutes: journeyTime,
        isStandard: dep.isStandard,
        via: via || undefined,
        viaTime,
        minutesEarly,
      });
    }
  }
  
  // Sort by least early (closest to target arrival)
  results.sort((a, b) => (a.minutesEarly || 0) - (b.minutesEarly || 0));
  return results;
}

// Find journey options for "depart after" query
export function findJourneysDepartAfter(
  origin: LocationCode,
  dest: LocationCode,
  departAfterMinutes: number,
  dayType: DayType,
  estate: Estate
): JourneyOption[] {
  const results: JourneyOption[] = [];
  const routeKey = getRouteKey(origin, dest, estate);
  
  if (!routeKey) return results;
  
  const schedule = getSchedule(estate);
  const route = schedule[routeKey];
  if (!route) return results;
  
  const departures = route[dayType];
  const via = getViaLocation(origin, dest);
  
  for (const dep of departures) {
    const depMins = timeToMinutes(dep.time);
    
    if (depMins >= departAfterMinutes) {
      const minutesWait = depMins - departAfterMinutes;
      
      // Include all journeys within 60 minutes (increased from 30)
      if (minutesWait > 60) continue;
      
      const journeyTime = calculateJourneyTime(origin, dest, dep.isStandard);
      const arriveMins = depMins + journeyTime;
      
      // Calculate via time if applicable
      let viaTime: string | undefined;
      if (via) {
        const viaJourneyTime = calculateJourneyTime(origin, via, dep.isStandard);
        viaTime = minutesToTime(depMins + viaJourneyTime);
      }
      
      results.push({
        departTime: dep.time,
        arriveTime: minutesToTime(arriveMins),
        journeyTimeMinutes: journeyTime,
        isStandard: dep.isStandard,
        via: via || undefined,
        viaTime,
        minutesWait,
      });
    }
  }
  
  // Sort by least wait time
  results.sort((a, b) => (a.minutesWait || 0) - (b.minutesWait || 0));
  return results;
}

// Get all journeys between two locations (for full day view)
export function getAllJourneys(
  origin: LocationCode,
  dest: LocationCode,
  dayType: DayType,
  estate: Estate,
  fromTime?: number
): JourneyOption[] {
  const results: JourneyOption[] = [];
  const routeKey = getRouteKey(origin, dest, estate);
  
  if (!routeKey) return results;
  
  const schedule = getSchedule(estate);
  const route = schedule[routeKey];
  if (!route) return results;
  
  const departures = route[dayType];
  const via = getViaLocation(origin, dest);
  const startTime = fromTime ?? 0;
  
  for (const dep of departures) {
    const depMins = timeToMinutes(dep.time);
    
    if (depMins >= startTime) {
      const journeyTime = calculateJourneyTime(origin, dest, dep.isStandard);
      const arriveMins = depMins + journeyTime;
      
      // Calculate via time if applicable
      let viaTime: string | undefined;
      if (via) {
        const viaJourneyTime = calculateJourneyTime(origin, via, dep.isStandard);
        viaTime = minutesToTime(depMins + viaJourneyTime);
      }
      
      results.push({
        departTime: dep.time,
        arriveTime: minutesToTime(arriveMins),
        journeyTimeMinutes: journeyTime,
        isStandard: dep.isStandard,
        via: via || undefined,
        viaTime,
      });
    }
  }
  
  return results;
}

// Calculate notification time (5 minutes before departure)
export function getNotificationTime(departTime: string): Date {
  const now = new Date();
  const [hours, minutes] = departTime.split(':').map(Number);
  
  const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  notificationTime.setMinutes(notificationTime.getMinutes() - 5);
  
  // If the notification time has already passed today, schedule for tomorrow
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1);
  }
  
  return notificationTime;
}

// Check if notification permission is granted
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Schedule a notification for a journey
export function scheduleJourneyNotification(
  journey: JourneyOption,
  origin: LocationCode,
  dest: LocationCode,
  lang: Language
): (() => void) | null {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  
  const notificationTime = getNotificationTime(journey.departTime);
  const now = new Date();
  const delay = notificationTime.getTime() - now.getTime();
  
  // If notification time has already passed, don't schedule
  if (delay <= 0) return null;
  
  const originName = LOCATION_NAMES[origin][lang];
  const destName = LOCATION_NAMES[dest][lang];
  
  const title = lang === 'en' 
    ? `Bus departing in 5 minutes`
    : `巴士將於5分鐘後開出`;
  
  const body = lang === 'en'
    ? `${originName} → ${destName} at ${journey.departTime}`
    : `${originName} → ${destName}，${journey.departTime}開出`;
  
  const timeoutId = window.setTimeout(() => {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `journey-${journey.departTime}`,
      requireInteraction: true,
    });
  }, delay);
  
  // Return cleanup function
  return () => window.clearTimeout(timeoutId);
}
