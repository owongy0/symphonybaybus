'use client';

import { Language, DAY_TYPE_LABELS, LOCATION_NAMES, UI_LABELS } from '../lib/schedule-types';
import { useFormattedDateTime } from '../hooks/useCurrentTime';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  onToggleLanguage: () => void;
  dayType: 'weekday' | 'weekend' | 'saturday' | 'sunday' | 'holiday';
  holidayName?: string | null;
}

export function Header({ lang, onToggleLanguage, dayType, holidayName }: HeaderProps) {
  const { dateStr, hours, minutes, seconds } = useFormattedDateTime(lang);
  const dayLabels = DAY_TYPE_LABELS[lang];

  const dayLabel = (() => {
    if (dayType === 'holiday') return dayLabels.holiday;
    if (dayType === 'sunday') return dayLabels.sunday;
    if (dayType === 'saturday') return dayLabels.saturday;
    return dayLabels.weekday;
  })();

  return (
    <header className="border-b border-[#C8D0D8] bg-white">
      <div className="max-w-4xl mx-auto px-4 py-5">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#334155]">
              {lang === 'en' ? 'Estate Bus Schedule' : '屋苑巴士時間表'}
            </h1>
            <p className="text-sm text-[#82A7C3] mt-0.5">
              {lang === 'en' ? 'Symphony Bay' : '帝琴灣'}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLanguage}
            className="flex items-center gap-2 text-[#334155] hover:text-[#82A7C3] hover:bg-[#F1F5F9]"
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{lang === 'en' ? '中文' : 'English'}</span>
          </Button>
        </div>

        {/* Modern Clock */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Digital Clock */}
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#334155]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {hours}
            </span>
            <span className="text-3xl sm:text-4xl font-semibold text-[#82A7C3] animate-pulse">
              :
            </span>
            <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#334155]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {minutes}
            </span>
            <span className="text-3xl sm:text-4xl font-semibold text-[#82A7C3] animate-pulse">
              :
            </span>
            <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#C8D0D8]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {seconds}
            </span>
          </div>

          {/* Date & Day Type */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
              dayType === 'holiday' || dayType === 'sunday' 
                ? 'bg-[#D8B4C7] text-white' 
                : dayType === 'saturday'
                  ? 'bg-[#82A7C3]/20 text-[#82A7C3] border border-[#82A7C3]/30'
                  : 'bg-[#334155] text-white'
            }`}>
              {dayLabel}
            </span>
            <div className="text-right">
              <div className="text-sm font-medium text-[#334155]">{dateStr}</div>
              {holidayName && (
                <div className="text-xs text-[#D8B4C7] font-semibold mt-0.5 bg-[#D8B4C7]/10 px-2 py-0.5 rounded-sm">
                  {holidayName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
