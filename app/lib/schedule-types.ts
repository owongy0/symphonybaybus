export type Language = 'en' | 'zh';

export type DayType = 'weekday' | 'weekend';

export type Estate = 'vr' | 'vc';

export type LocationCode = 'ntp' | 'sc' | 'vr' | 'vc';

export interface BusDeparture {
  time: string; // HH:MM format
  isStandard: boolean; // true = Standard Service (stops at On Luk St/Sunshine City)
}

export interface Holiday {
  date: string; // YYYY-MM-DD format
  nameEn: string;
  nameZh: string;
}

export interface ScheduleRoute {
  weekday: BusDeparture[];
  weekend: BusDeparture[];
}

export type ScheduleData = Record<string, ScheduleRoute>;

export interface NextBusResult {
  departure: BusDeparture;
  previousDeparture: BusDeparture;
  minutesUntil: number;
  progressPercent: number;
  isTomorrow: boolean;
}

export interface JourneyOption {
  departTime: string;
  arriveTime: string;
  journeyTimeMinutes: number;
  isStandard: boolean;
  via?: LocationCode;
  viaTime?: string;
  minutesEarly?: number;
  minutesWait?: number;
}

export interface RuntimeConfig {
  regular: Record<string, number>; // minutes
  special: Record<string, number>; // minutes (for limited/express services)
}

export const LOCATION_NAMES: Record<LocationCode, { en: string; zh: string }> = {
  ntp: { en: 'New Town Plaza', zh: '新城市廣場' },
  sc: { en: 'Sunshine City', zh: '新港城' },
  vr: { en: 'Villa Rhapsody', zh: '凱琴居' },
  vc: { en: 'Villa Concerto', zh: '凱弦居' },
};

export const SERVICE_TYPE_LABELS = {
  en: {
    // Reversed from government PDF terminology
    // isStandard=true (marked * in PDF, stops at SC) -> "Limited Service"
    // isStandard=false (no mark in PDF, bypass) -> "Standard Service"
    standard: 'Limited Service',
    limited: 'Standard Service',
    standardDesc: 'Stops at Sunshine City',
    limitedDesc: 'Bypass via Express',
  },
  zh: {
    standard: '有限班次',
    limited: '標準班次',
    standardDesc: '途經新港城',
    limitedDesc: '直達經繞道',
  },
};

export const DAY_TYPE_LABELS = {
  en: {
    weekday: 'Weekday',
    saturday: 'Weekend',
    sunday: 'Weekend',
    holiday: 'Holiday',
  },
  zh: {
    weekday: '平日',
    saturday: '週末',
    sunday: '週末',
    holiday: '假期',
  },
};

export const UI_LABELS = {
  en: {
    nextBuses: 'Next Buses',
    schedule: 'Schedule',
    journeyPlanner: 'Journey Planner',
    weekday: 'Weekday',
    weekend: 'Weekend/Holiday',
    mainRoute: 'New Town Plaza Route',
    shortRoute: 'Ma On Shan Route',
    to: 'to',
    from: 'From',
    arrivingIn: 'Arriving in',
    arrivingTomorrow: 'Arriving tomorrow',
    departAt: 'Depart At',
    arriveBy: 'Arrive By',
    planJourney: 'Plan Journey',
    origin: 'Origin',
    destination: 'Destination',
    time: 'Time',
    date: 'Date',
    searchTime: 'Search time (e.g. 08:30)',
    noBuses: 'No buses found',
    minutes: 'min',
    hours: 'hr',
    via: 'Via',
    transferAt: 'Transfer at',
    passThrough: 'Pass through',
    arriving: 'Arriving',
    wait: 'Wait',
    early: 'early',
    onTime: 'on time',
    option: 'Option',
    journeyTime: 'Journey time',
    noResults: 'No suitable buses found. Try a different time.',
    notifyMe: 'Notify Me',
    notifyEnabled: 'Notification Set',
    notifyError: 'Please allow notifications in browser settings',
    departureSoon: 'Bus departing soon',
    viewAllJourneys: 'View All Journeys',
    upcoming: 'Upcoming',
    allDay: 'All Day',
    bestOption: 'Best Option',
    recommended: 'Recommended',
  },
  zh: {
    nextBuses: '下一班車',
    schedule: '時間表',
    journeyPlanner: '行程規劃',
    weekday: '平日',
    weekend: '週末及假期',
    mainRoute: '新城市廣場線',
    shortRoute: '馬鞍山線',
    to: '往',
    from: '由',
    arrivingIn: '還有',
    arrivingTomorrow: '明天到達',
    departAt: '出發時間',
    arriveBy: '到達時間',
    planJourney: '規劃行程',
    origin: '出發地',
    destination: '目的地',
    time: '時間',
    date: '日期',
    searchTime: '搜尋時間 (例如 08:30)',
    noBuses: '找不到巴士',
    minutes: '分鐘',
    hours: '小時',
    via: '途經',
    transferAt: '在轉車',
    passThrough: '途經',
    arriving: '到達',
    wait: '等候',
    early: '提早',
    onTime: '準時',
    option: '選項',
    journeyTime: '行程時間',
    noResults: '找不到合適的巴士。請嘗試不同時間。',
    notifyMe: '提醒我',
    notifyEnabled: '已設定提醒',
    notifyError: '請在瀏覽器設定中允許通知',
    departureSoon: '巴士即將開出',
    viewAllJourneys: '查看全日班次',
    upcoming: '即將開出',
    allDay: '全日班次',
    bestOption: '最佳選擇',
    recommended: '推薦',
  },
};
