'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Estate, Language, LOCATION_NAMES } from '../lib/schedule-types';

interface EstateSelectorProps {
  value: Estate;
  onChange: (estate: Estate) => void;
  lang: Language;
}

export function EstateSelector({ value, onChange, lang }: EstateSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Estate)}>
      <TabsList className="w-full bg-[#F1F5F9] p-1.5">
        <TabsTrigger 
          value="vr" 
          className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#334155] data-[state=active]:shadow-sm text-[#334155]/60"
        >
          {LOCATION_NAMES['vr'][lang]}
        </TabsTrigger>
        <TabsTrigger 
          value="vc" 
          className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#334155] data-[state=active]:shadow-sm text-[#334155]/60"
        >
          {LOCATION_NAMES['vc'][lang]}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
