import { NextResponse } from 'next/server';

// Force static generation for static export
export const dynamic = 'force-static';
export const revalidate = false;

const HOLIDAY_ICS_URL = 'https://www.1823.gov.hk/common/ical/en.ics';

interface Holiday {
  date: string;
  nameEn: string;
  nameZh: string;
}

function parseICal(data: string): Holiday[] {
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

export async function GET() {
  try {
    const response = await fetch(HOLIDAY_ICS_URL, {
      next: { revalidate: 86400 }, // Cache for 1 day
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch holidays' },
        { status: 502 }
      );
    }
    
    const icalData = await response.text();
    const holidays = parseICal(icalData);
    
    return NextResponse.json({ holidays });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
