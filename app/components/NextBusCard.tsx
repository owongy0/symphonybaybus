'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NextBusResult, Language, SERVICE_TYPE_LABELS } from '../lib/schedule-types';
import { formatDuration } from '../lib/schedule-logic';
import { UI_LABELS } from '../lib/schedule-types';

interface NextBusCardProps {
  title: string;
  result: NextBusResult | null;
  lang: Language;
}

export function NextBusCard({ title, result, lang }: NextBusCardProps) {
  if (!result) {
    return (
      <Card className="border-[#C8D0D8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[#334155]/60">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#334155]">--:--</div>
          <div className="text-sm text-[#C8D0D8]">{UI_LABELS[lang].noBuses}</div>
        </CardContent>
      </Card>
    );
  }

  const { departure, minutesUntil, progressPercent, isTomorrow } = result;
  const labels = SERVICE_TYPE_LABELS[lang];
  const ui = UI_LABELS[lang];

  return (
    <Card className="border-[#C8D0D8] hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-[#334155]/70">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight text-[#334155]">
            {departure.time}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-sm font-medium ${
            departure.isStandard 
              ? 'bg-[#D8B4C7] text-white' 
              : 'bg-[#334155] text-white'
          }`}>
            {departure.isStandard ? labels.standard : labels.limited}
          </span>
        </div>

        {/* Countdown */}
        <div className="text-sm font-medium text-[#334155]/80">
          {isTomorrow 
            ? `${ui.arrivingTomorrow} ${formatDuration(minutesUntil, lang)}`
            : `${ui.arrivingIn} ${formatDuration(minutesUntil, lang)}`
          }
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#82A7C3] transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Service Description */}
        <div className="text-xs text-[#334155]/60">
          {departure.isStandard ? labels.standardDesc : labels.limitedDesc}
        </div>
      </CardContent>
    </Card>
  );
}
