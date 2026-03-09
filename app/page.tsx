'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { EstateSelector } from './components/EstateSelector';
import { NextBusCard } from './components/NextBusCard';
import { ScheduleGrid } from './components/ScheduleGrid';
import { JourneyPlanner } from './components/JourneyPlanner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage, useEstate } from './hooks/useLanguage';
import { useHolidays } from './hooks/useHolidays';
import { useCurrentTime } from './hooks/useCurrentTime';
import { 
  Estate, 
  Language, 
  NextBusResult, 
  UI_LABELS,
  LOCATION_NAMES 
} from './lib/schedule-types';
import { 
  getDayType, 
  getNextBus, 
  formatDateKey 
} from './lib/schedule-logic';

export default function Home() {
  const { lang, toggleLanguage, isInitialized: langInitialized } = useLanguage();
  const { estate, setEstate, isInitialized: estateInitialized } = useEstate();
  const { holidaySet, getHolidayForDate } = useHolidays();
  const now = useCurrentTime();
  const [activeTab, setActiveTab] = useState('next');
  const [nextBuses, setNextBuses] = useState<Record<string, NextBusResult | null>>({});

  // Calculate day type
  const dayType = useMemo(() => {
    if (!now) return 'weekday';
    return getDayType(now, holidaySet);
  }, [now, holidaySet]);

  // Get holiday info
  const holiday = useMemo(() => {
    if (!now) return null;
    return getHolidayForDate(now);
  }, [now, getHolidayForDate]);

  // Determine display day type
  const displayDayType = useMemo(() => {
    if (holiday) return 'holiday';
    const day = now?.getDay();
    if (day === 0) return 'sunday';
    if (day === 6) return 'saturday';
    return 'weekday';
  }, [holiday, now]);

  // Update next buses
  const updateNextBuses = useCallback(() => {
    if (!now) return;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const dt = dayType;

    if (estate === 'vr') {
      setNextBuses({
        'ntp-vr': getNextBus('ntp-vr', 'vr', dt, currentMinutes),
        'vr-ntp': getNextBus('vr-ntp', 'vr', dt, currentMinutes),
        'mos-vr': getNextBus('mos-vr', 'vr', dt, currentMinutes),
        'vr-mos': getNextBus('vr-mos', 'vr', dt, currentMinutes),
      });
    } else {
      setNextBuses({
        'ntp-vc': getNextBus('ntp-vc', 'vc', dt, currentMinutes),
        'vc-ntp': getNextBus('vc-ntp', 'vc', dt, currentMinutes),
        'mos-vc': getNextBus('mos-vc', 'vc', dt, currentMinutes),
        'vc-mos': getNextBus('vc-mos', 'vc', dt, currentMinutes),
      });
    }
  }, [now, dayType, estate]);

  // Update buses every second
  useEffect(() => {
    updateNextBuses();
  }, [updateNextBuses]);

  const ui = UI_LABELS[lang];

  const isInitialized = langInitialized && estateInitialized;
  
  if (!isInitialized || !now) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header
        lang={lang}
        onToggleLanguage={toggleLanguage}
        dayType={displayDayType}
        holidayName={holiday ? (lang === 'en' ? holiday.nameEn : holiday.nameZh) : null}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Estate Selector */}
        <EstateSelector
          value={estate}
          onChange={setEstate}
          lang={lang}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="next" className="flex-1">{ui.nextBuses}</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">{ui.schedule}</TabsTrigger>
            <TabsTrigger value="journey" className="flex-1">{ui.journeyPlanner}</TabsTrigger>
          </TabsList>

          {/* Next Buses Tab */}
          <TabsContent value="next" className="space-y-6">
            {/* Main Route */}
            <div>
              <h2 className="text-sm font-medium text-[#334155]/60 mb-3">{ui.mainRoute}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NextBusCard
                  title={estate === 'vr' 
                    ? `${LOCATION_NAMES['ntp'][lang]} → ${LOCATION_NAMES['vr'][lang]}`
                    : `${LOCATION_NAMES['ntp'][lang]} → ${LOCATION_NAMES['vc'][lang]}`
                  }
                  result={estate === 'vr' ? nextBuses['ntp-vr'] : nextBuses['ntp-vc']}
                  lang={lang}
                />
                <NextBusCard
                  title={estate === 'vr' 
                    ? `${LOCATION_NAMES['vr'][lang]} → ${LOCATION_NAMES['ntp'][lang]}`
                    : `${LOCATION_NAMES['vc'][lang]} → ${LOCATION_NAMES['ntp'][lang]}`
                  }
                  result={estate === 'vr' ? nextBuses['vr-ntp'] : nextBuses['vc-ntp']}
                  lang={lang}
                />
              </div>
            </div>

            {/* Short Route */}
            <div>
              <h2 className="text-sm font-medium text-[#334155]/60 mb-3">{ui.shortRoute}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NextBusCard
                  title={estate === 'vr'
                    ? `${LOCATION_NAMES['sc'][lang]} → ${LOCATION_NAMES['vr'][lang]}`
                    : `${LOCATION_NAMES['sc'][lang]} → ${LOCATION_NAMES['vc'][lang]}`
                  }
                  result={estate === 'vr' ? nextBuses['mos-vr'] : nextBuses['mos-vc']}
                  lang={lang}
                />
                <NextBusCard
                  title={estate === 'vr'
                    ? `${LOCATION_NAMES['vr'][lang]} → ${LOCATION_NAMES['sc'][lang]}`
                    : `${LOCATION_NAMES['vc'][lang]} → ${LOCATION_NAMES['sc'][lang]}`
                  }
                  result={estate === 'vr' ? nextBuses['vr-mos'] : nextBuses['vc-mos']}
                  lang={lang}
                />
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <ScheduleGrid
              estate={estate}
              lang={lang}
              dayType={dayType}
            />
          </TabsContent>

          {/* Journey Planner Tab */}
          <TabsContent value="journey">
            <JourneyPlanner
              estate={estate}
              lang={lang}
              dayType={dayType}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
