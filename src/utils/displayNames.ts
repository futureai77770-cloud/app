import { PrayerType, PrayerStatus } from '../types';
import { DEFAULT_HABITS, ALL_COUNTERS } from '../data/defaultData';

export const PRAYER_DISPLAY_NAMES: Record<PrayerType, string> = {
  FAJR: 'الفجر',
  DHUHR: 'الظهر',
  ASR: 'العصر',
  MAGHRIB: 'المغرب',
  ISHA: 'العشاء'
};

export const PRAYER_STATUS_DISPLAY_NAMES: Record<PrayerStatus, string> = {
  CONGREGATION: 'صلاة جماعة 🕌',
  INDIVIDUAL: 'صليت في وقتها (منفرد) ✓',
  MISSED: 'لم أصلِّ ✕',
  UNRECORDED: 'لم تُسجل بعد ○'
};

export const PRAYER_STATUS_SHORT_NAMES: Record<PrayerStatus, string> = {
  CONGREGATION: 'جماعة 🕌',
  INDIVIDUAL: 'منفرد ✓',
  MISSED: 'لم أصلِّ ✕',
  UNRECORDED: 'غير مسجل'
};

export function getPrayerDisplayName(prayer: string): string {
  const upper = prayer.toUpperCase() as PrayerType;
  return PRAYER_DISPLAY_NAMES[upper] || prayer;
}

export function getPrayerStatusDisplayName(status: string): string {
  const upper = status.toUpperCase() as PrayerStatus;
  return PRAYER_STATUS_DISPLAY_NAMES[upper] || status;
}

export function getHabitDisplayName(habitKey: string): string {
  const def = DEFAULT_HABITS.find((h) => h.key === habitKey);
  if (def) return def.titleArabic;

  const fallbackMap: Record<string, string> = {
    quran_wird: 'ورد القرآن الكريم',
    duha_prayer: 'صلاة الضحى',
    sleep_azkar: 'أذكار النوم',
    dua_daily: 'الدعاء وسؤال الله',
    witr_prayer: 'صلاة الوتر',
    night_prayer: 'قيام الليل'
  };

  return fallbackMap[habitKey] || habitKey;
}

export function getCounterDisplayName(counterKey: string): string {
  const def = ALL_COUNTERS.find((c) => c.key === counterKey);
  if (def) return def.titleArabic;

  const fallbackMap: Record<string, string> = {
    counter_istighfar: 'الاستغفار',
    counter_tasbih: 'التسبيح',
    counter_tahmid: 'التحميد',
    counter_takbir: 'التكبير',
    counter_salat_nabi_morning: 'الصلاة على النبي (صباحًا)',
    counter_salat_nabi_evening: 'الصلاة على النبي (مساءً)',
    counter_tahlil: 'التهليل',
    counter_hawqalah: 'الحوقلة'
  };

  return fallbackMap[counterKey] || counterKey;
}
