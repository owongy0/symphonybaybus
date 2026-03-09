'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ScheduleData, Language, DayType, Estate, UI_LABELS, SERVICE_TYPE_LABELS } from '../lib/schedule-types';
import { getSchedule, ROUTE_NAMES } from '../lib/schedule-data';
import { timeToMinutes, getCurrentTimeMinutes } from '../lib/schedule-logic';

interface ScheduleGridProps {
  estate: Estate;
  lang: Language;
  dayType: DayType;
}

export function ScheduleGrid({ estate, lang, dayType }: ScheduleGridProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>('ntp-vr');
  
  // Update selected route when estate changes
  useEffect(() => {
    const schedule = getSchedule(estate);
    const availableRoutes = Object.keys(schedule);
    if (!availableRoutes.includes(selectedRoute)) {
      setSelectedRoute(availableRoutes[0] || 'ntp-vr');
    }
  }, [estate, selectedRoute]);

  const [selectedDayType, setSelectedDayType] = useState<DayType>(dayType);
  const [searchTime, setSearchTime] = useState('');

  const schedule = getSchedule(estate);
  const ui = UI_LABELS[lang];
  const serviceLabels = SERVICE_TYPE_LABELS[lang];

  // Get available routes for this estate
  const availableRoutes = useMemo(() => {
    return Object.keys(schedule).map(key => ({
      key,
      name: ROUTE_NAMES[key]?.[lang] || key,
    }));
  }, [schedule, lang]);

  // Get departures for selected route
  const departures = useMemo(() => {
    const route = schedule[selectedRoute];
    if (!route) return [];
    return route[selectedDayType] || [];
  }, [schedule, selectedRoute, selectedDayType]);

  // Filter departures
  const filteredDepartures = useMemo(() => {
    if (!searchTime) return departures;
    return departures.filter(d => d.time.includes(searchTime));
  }, [departures, searchTime]);

  // Find next departure
  const currentMinutes = getCurrentTimeMinutes();
  const nextDepartureTime = useMemo(() => {
    if (selectedDayType !== dayType) return null;
    for (const dep of departures) {
      if (timeToMinutes(dep.time) > currentMinutes) {
        return dep.time;
      }
    }
    return departures[0]?.time || null;
  }, [departures, currentMinutes, selectedDayType, dayType]);

  return (
    <Card className="border-[#C8D0D8]">
      <CardHeader>
        <CardTitle className="text-[#334155]">{ui.schedule}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="flex-1"
          >
            {availableRoutes.map(route => (
              <option key={route.key} value={route.key}>{route.name}</option>
            ))}
          </Select>
          <Select
            value={selectedDayType}
            onChange={(e) => setSelectedDayType(e.target.value as DayType)}
            className="w-full sm:w-44"
          >
            <option value="weekday">{ui.weekday}</option>
            <option value="weekend">{ui.weekend}</option>
          </Select>
        </div>

        {/* Search */}
        <Input
          type="text"
          placeholder={ui.searchTime}
          value={searchTime}
          onChange={(e) => setSearchTime(e.target.value)}
          className="focus-visible:ring-[#D8B4C7] focus-visible:border-[#D8B4C7]"
        />

        {/* Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {filteredDepartures.map((dep, idx) => {
            const isNext = dep.time === nextDepartureTime && selectedDayType === dayType;
            return (
              <div
                key={idx}
                className={`
                  relative px-2 py-2.5 text-center text-sm rounded-md border font-medium
                  ${dep.isStandard 
                    ? 'bg-[#82A7C3] text-white border-[#82A7C3]' 
                    : 'bg-[#F1F5F9] text-[#334155] border-[#C8D0D8]'
                  }
                  ${isNext ? 'ring-2 ring-[#D8B4C7] ring-offset-2' : ''}
                  ${searchTime && dep.time.includes(searchTime) ? 'ring-1 ring-[#D8B4C7]' : ''}
                `}
              >
                {dep.time}
              </div>
            );
          })}
        </div>

        {filteredDepartures.length === 0 && (
          <div className="text-center text-[#C8D0D8] py-8">
            {ui.noBuses}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-[#C8D0D8]/50 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#82A7C3] rounded-sm" />
            <span className="text-[#334155]">{serviceLabels.standard} (Via SC)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#F1F5F9] border border-[#C8D0D8] rounded-sm" />
            <span className="text-[#334155]">{serviceLabels.limited} (Bypass)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-[#D8B4C7] rounded-sm" />
            <span className="text-[#334155]">{ui.nextBuses}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
