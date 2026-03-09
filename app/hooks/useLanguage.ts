'use client';

import { useState, useEffect } from 'react';
import { Language, Estate } from '../lib/schedule-types';

const LANG_STORAGE_KEY = 'bus_schedule_lang';
const ESTATE_STORAGE_KEY = 'bus_schedule_estate';

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || 'en';
  
  // Check for Chinese language codes
  if (browserLang.startsWith('zh') || browserLang.startsWith('cn') || browserLang.startsWith('hk')) {
    return 'zh';
  }
  
  return 'en';
}

export function useLanguage() {
  const [lang, setLang] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Try to load saved preference first
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') {
      setLang(saved);
    } else {
      // Detect from browser
      setLang(detectBrowserLanguage());
    }
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  }, [lang, isInitialized]);
  
  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };
  
  return { lang, setLang, toggleLanguage, isInitialized };
}

export function useEstate() {
  const [estate, setEstate] = useState<Estate>('vr');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem(ESTATE_STORAGE_KEY);
    if (saved === 'vr' || saved === 'vc') {
      setEstate(saved);
    }
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(ESTATE_STORAGE_KEY, estate);
    }
  }, [estate, isInitialized]);
  
  return { estate, setEstate, isInitialized };
}
