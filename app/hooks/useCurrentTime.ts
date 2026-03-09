'use client';

import { useState, useEffect } from 'react';

export function useCurrentTime() {
  const [now, setNow] = useState<Date | null>(null);
  
  useEffect(() => {
    setNow(new Date());
    
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return now;
}

export function useFormattedDateTime(lang: 'en' | 'zh') {
  const now = useCurrentTime();
  
  if (!now) {
    return { dateStr: '', timeStr: '', hours: '00', minutes: '00', seconds: '00' };
  }
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  let dateStr: string;
  
  if (lang === 'en') {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    dateStr = now.toLocaleDateString('en-US', options);
  } else {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[now.getDay()];
    dateStr = `${year}年${month}月${day}日 星期${weekday}`;
  }
  
  return { dateStr, hours, minutes, seconds };
}
