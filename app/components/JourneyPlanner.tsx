'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Bell, BellRing, Clock, ArrowRight, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { 
  Language, 
  Estate, 
  DayType, 
  LocationCode, 
  JourneyOption,
  UI_LABELS,
  LOCATION_NAMES,
  SERVICE_TYPE_LABELS
} from '../lib/schedule-types';
import { 
  findJourneysArriveBy, 
  findJourneysDepartAfter,
  getAllJourneys,
  timeToMinutes,
  minutesToTime,
  formatDuration,
  requestNotificationPermission,
  scheduleJourneyNotification
} from '../lib/schedule-logic';

interface JourneyPlannerProps {
  estate: Estate;
  lang: Language;
  dayType: DayType;
}

const LOCATIONS: LocationCode[] = ['ntp', 'sc', 'vr', 'vc'];

export function JourneyPlanner({ estate, lang, dayType }: JourneyPlannerProps) {
  const [origin, setOrigin] = useState<LocationCode>('ntp');
  const [destination, setDestination] = useState<LocationCode>(estate === 'vr' ? 'vr' : 'vc');
  const [journeyType, setJourneyType] = useState<'depart' | 'arrive'>('depart');
  const [time, setTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [results, setResults] = useState<JourneyOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<Set<string>>(new Set());
  const cleanupFnsRef = useRef<Map<string, () => void>>(new Map());

  // Update destination when estate changes
  useEffect(() => {
    setDestination(estate === 'vr' ? 'vr' : 'vc');
  }, [estate]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  // Cleanup notifications on unmount
  useEffect(() => {
    return () => {
      cleanupFnsRef.current.forEach((cleanup) => cleanup());
      cleanupFnsRef.current.clear();
    };
  }, []);

  const ui = UI_LABELS[lang];
  const serviceLabels = SERVICE_TYPE_LABELS[lang];

  const locationOptions = useMemo(() => {
    return LOCATIONS.map(code => ({
      code,
      name: LOCATION_NAMES[code][lang],
    }));
  }, [lang]);

  const handleSearch = useCallback(() => {
    if (origin === destination) return;
    
    const timeMinutes = timeToMinutes(time);
    let journeyResults: JourneyOption[] = [];
    
    if (journeyType === 'arrive') {
      journeyResults = findJourneysArriveBy(origin, destination, timeMinutes, dayType, estate);
    } else {
      journeyResults = findJourneysDepartAfter(origin, destination, timeMinutes, dayType, estate);
    }
    
    setResults(journeyResults);
    setHasSearched(true);
    setViewMode('upcoming');
    
    // Clear previous notifications
    cleanupFnsRef.current.forEach((cleanup) => cleanup());
    cleanupFnsRef.current.clear();
    setScheduledNotifications(new Set());
  }, [origin, destination, journeyType, time, dayType, estate]);

  const handleViewAll = useCallback(() => {
    if (origin === destination) return;
    
    const timeMinutes = timeToMinutes(time);
    const allJourneys = getAllJourneys(origin, destination, dayType, estate, timeMinutes);
    
    setResults(allJourneys);
    setHasSearched(true);
    setViewMode('all');
  }, [origin, destination, time, dayType, estate]);

  const handleRequestNotification = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted);
    return granted;
  }, []);

  const handleScheduleNotification = useCallback(async (journey: JourneyOption) => {
    if (!notificationPermission) {
      const granted = await handleRequestNotification();
      if (!granted) return;
    }

    const cleanup = scheduleJourneyNotification(journey, origin, destination, lang);
    if (cleanup) {
      const key = `${journey.departTime}-${journey.arriveTime}`;
      cleanupFnsRef.current.set(key, cleanup);
      setScheduledNotifications(prev => new Set(prev).add(key));
    }
  }, [notificationPermission, origin, destination, lang, handleRequestNotification]);

  // Auto-search on initial load
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <Card className="border-[#C8D0D8]">
      <CardHeader>
        <CardTitle className="text-[#334155]">{ui.journeyPlanner}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#334155]">{ui.origin}</label>
            <Select
              value={origin}
              onChange={(e) => setOrigin(e.target.value as LocationCode)}
            >
              {locationOptions.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#334155]">{ui.destination}</label>
            <Select
              value={destination}
              onChange={(e) => setDestination(e.target.value as LocationCode)}
            >
              {locationOptions.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#334155]">{ui.time}</label>
            <div className="flex gap-2">
              <Select
                value={journeyType}
                onChange={(e) => setJourneyType(e.target.value as 'depart' | 'arrive')}
                className="w-32"
              >
                <option value="depart">{ui.departAt}</option>
                <option value="arrive">{ui.arriveBy}</option>
              </Select>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="flex items-end gap-2">
            <Button 
              onClick={handleSearch}
              disabled={origin === destination}
              className="flex-1"
            >
              {ui.planJourney}
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        {hasSearched && results.length > 0 && (
          <div className="flex gap-2 pt-2">
            <Button
              variant={viewMode === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={handleSearch}
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-2" />
              {ui.upcoming}
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={handleViewAll}
              className="flex-1"
            >
              {ui.allDay}
            </Button>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="space-y-3 pt-4 border-t border-[#C8D0D8]/50">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#334155]/60">
                {results.length > 0 && (
                  <span>
                    {viewMode === 'upcoming' 
                      ? `${results.length} ${lang === 'en' ? 'options found' : '個選項'}`
                      : `${results.length} ${lang === 'en' ? 'journeys today' : '個班次'}`
                    }
                  </span>
                )}
              </div>
              {notificationPermission === false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRequestNotification}
                  className="text-xs text-[#82A7C3]"
                >
                  <Bell className="w-3 h-3 mr-1" />
                  {lang === 'en' ? 'Enable Notifications' : '啟用通知'}
                </Button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center text-[#334155]/60 py-8">
                {ui.noResults}
              </div>
            ) : (
              <div 
                className={`space-y-3 ${viewMode === 'all' ? 'max-h-[500px] overflow-y-auto pr-1 scrollbar-thin' : ''}`}
              >
                {results.map((result, idx) => (
                  <JourneyResultCard 
                    key={`${result.departTime}-${result.arriveTime}`}
                    result={result}
                    idx={idx}
                    origin={origin}
                    destination={destination}
                    journeyType={journeyType}
                    lang={lang}
                    viewMode={viewMode}
                    isNotificationScheduled={scheduledNotifications.has(`${result.departTime}-${result.arriveTime}`)}
                    onScheduleNotification={handleScheduleNotification}
                    notificationPermission={notificationPermission}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface JourneyResultCardProps {
  result: JourneyOption;
  idx: number;
  origin: LocationCode;
  destination: LocationCode;
  journeyType: 'depart' | 'arrive';
  lang: Language;
  viewMode: 'upcoming' | 'all';
  isNotificationScheduled: boolean;
  onScheduleNotification: (journey: JourneyOption) => void;
  notificationPermission: boolean;
}

function JourneyResultCard({ 
  result, 
  idx, 
  origin, 
  destination, 
  journeyType,
  lang,
  viewMode,
  isNotificationScheduled,
  onScheduleNotification,
  notificationPermission
}: JourneyResultCardProps) {
  const ui = UI_LABELS[lang];
  const serviceLabels = SERVICE_TYPE_LABELS[lang];
  const isBestOption = idx === 0 && viewMode === 'upcoming';

  return (
    <div className={`
      border rounded-xl p-4 space-y-3 transition-all
      ${isBestOption 
        ? 'border-[#82A7C7] bg-[#82A7C3]/5 ring-1 ring-[#82A7C3]' 
        : 'border-[#C8D0D8] bg-white hover:border-[#82A7C3]/50'
      }
    `}>
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Time Display */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#334155]">{result.departTime}</span>
            <ArrowRight className="w-4 h-4 text-[#C8D0D8]" />
            <span className="text-2xl font-semibold text-[#334155]">{result.arriveTime}</span>
          </div>
          
          {/* Best Option Badge */}
          {isBestOption && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#82A7C3] text-white">
              <Star className="w-3 h-3" />
              {ui.recommended}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Service Type Badge */}
          <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
            result.isStandard 
              ? 'bg-[#D8B4C7] text-white' 
              : 'bg-[#334155] text-white'
          }`}>
            {result.isStandard ? serviceLabels.standard : serviceLabels.limited}
          </span>
          
          {/* Notification Button */}
          {notificationPermission && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onScheduleNotification(result)}
              disabled={isNotificationScheduled}
              className={`p-1.5 h-auto ${
                isNotificationScheduled 
                  ? 'text-green-600 hover:text-green-600' 
                  : 'text-[#82A7C3] hover:text-[#6B8FA8]'
              }`}
              title={isNotificationScheduled ? ui.notifyEnabled : ui.notifyMe}
            >
              {isNotificationScheduled ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Route Info */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#334155]/70">{LOCATION_NAMES[origin][lang]}</span>
        {result.via && (
          <>
            <ArrowRight className="w-3 h-3 text-[#C8D0D8]" />
            <span className="text-[#334155]/50 text-xs">{LOCATION_NAMES[result.via][lang]}</span>
          </>
        )}
        <ArrowRight className="w-3 h-3 text-[#C8D0D8]" />
        <span className="text-[#334155]/70">{LOCATION_NAMES[destination][lang]}</span>
      </div>

      {/* Details Row */}
      <div className="flex items-center justify-between pt-2 border-t border-[#C8D0D8]/30">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#334155]/60">
            {ui.journeyTime}: <span className="font-medium text-[#334155]">{formatDuration(result.journeyTimeMinutes, lang)}</span>
          </span>
          
          {viewMode === 'upcoming' && (
            <span className="text-[#82A7C3] font-medium">
              {journeyType === 'arrive' 
                ? result.minutesEarly === 0 
                  ? ui.onTime
                  : `${result.minutesEarly}${ui.minutes} ${ui.early}`
                : `${ui.wait} ${result.minutesWait}${ui.minutes}`
              }
            </span>
          )}
        </div>
        
        {/* Via Time */}
        {result.via && result.viaTime && (
          <span className="text-xs text-[#334155]/50">
            {ui.via} {result.viaTime}
          </span>
        )}
      </div>
    </div>
  );
}
