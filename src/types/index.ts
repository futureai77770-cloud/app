export type PrayerStatus = 'CONGREGATION' | 'INDIVIDUAL' | 'MISSED' | 'UNRECORDED';

export type PrayerType = 'FAJR' | 'DHUHR' | 'ASR' | 'MAGHRIB' | 'ISHA';

export type HabitStatus = 'DONE' | 'NOT_DONE' | 'UNRECORDED';

export interface PrayerRecord {
  id: string; // e.g. "2026-02-20_FAJR"
  dayKey: string; // YYYY-MM-DD
  prayer: PrayerType;
  scheduledTime: string; // e.g. "05:03"
  status: PrayerStatus;
  reason?: string | null;
  customReason?: string | null;
  recordedAt?: number | null;
}

export interface HabitRecord {
  id: string; // e.g. "2026-02-20_quran_wird"
  dayKey: string;
  habitKey: string;
  titleArabic: string;
  isCompleted: boolean;
  status?: HabitStatus;
  currentValue: number;
  targetValue: number;
  unitArabic: string;
  notes?: string | null;
  updatedAt?: number | null;
}

export interface CounterRecord {
  id: string; // e.g. "2026-02-20_counter_istighfar"
  dayKey: string;
  counterKey: string;
  titleArabic: string;
  count: number;
  target: number;
  isCompleted?: boolean;
  completedOutside?: boolean;
  updatedAt?: number | null;
}

export interface DailyReflection {
  dayKey: string;
  isCompleted: boolean;
  struggledHabit?: string | null;
  struggleReason?: string | null;
  customReason?: string | null;
  note?: string | null;
  recordedAt?: number | null;
}

export interface WeeklyReport {
  weekKey: string; // Friday YYYY-MM-DD
  startDate: string; // YYYY-MM-DD (Friday)
  endDate: string; // YYYY-MM-DD (Thursday)
  finalizedAt: number;
  congregationRate: number; // percentage 0-100
  individualRate: number; // percentage 0-100
  missedPrayersCount: number;
  unrecordedPrayersCount?: number;
  completedHabitsRate: number; // percentage 0-100
  totalQuranDays: number;
  totalTasbihCount: number;
  topStruggledHabitsJson: string;
  weeklyEncouragement: string;
}

export interface UserSettings {
  id: string;
  isDarkMode?: boolean | null;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  selectedCity: string;
  cityLat: number;
  cityLng: number;
  isOnboarded: boolean;
  lastActiveDayKey?: string | null;
}

export interface DayRecord {
  dayKey: string;
  isFinalized: boolean;
  finalizedAt?: number | null;
  createdAt: number;
}

export interface EgyptianCity {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  latitude: number;
  longitude: number;
}

export interface DailyPrayerTimes {
  dayKey: string;
  cityName: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
  lastThird: string;
  fajrDate: Date;
  sunriseDate: Date;
  dhuhrDate: Date;
  asrDate: Date;
  maghribDate: Date;
  ishaDate: Date;
  nextFajrDate: Date;
}

export interface NextPrayerInfo {
  nextPrayer: PrayerType;
  nextPrayerArabic: string;
  timeString: string;
  remainingMinutes: number;
  formattedCountdown: string;
  isToday: boolean;
  progressPercent: number;
}

export interface PreviousDayReviewState {
  dayKey: string;
  dateFormattedArabic: string;
  allPrayers: PrayerRecord[];
  allHabits: HabitRecord[];
  allCounters: CounterRecord[];
  unrecordedPrayers: PrayerRecord[];
  incompleteHabits: HabitRecord[];
  needsReview: boolean;
  isFinalized: boolean;
}

export interface WeekPrayerStat {
  prayer: string;
  titleArabic: string;
  recordedDays: number;
  congregationDays: number;
  individualDays: number;
  missedDays: number;
  unrecordedDays: number;
}

export interface WeekHabitStat {
  habitKey: string;
  titleArabic: string;
  recordedDays: number;
  unrecordedDays: number;
}

export interface WeekCounterStat {
  counterKey: string;
  titleArabic: string;
  totalCount: number;
  recordedDays: number;
}

export interface WeekDayStatus {
  dayKey: string;
  dayNameArabic: string;
  dateFormatted: string;
  isFinalized: boolean;
  isPendingReview: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekSummaryStats {
  recordedDaysCount: number;
  finalizedDaysCount: number;
  pendingReviewDaysCount: number;
  recordedPrayersCount: number;
  recordedHabitsCount: number;
}

export interface DayPrayerRow {
  dayKey: string;
  dayNameArabic: string;
  dateFormatted: string;
  isToday: boolean;
  isPendingReview: boolean;
  isFinalized: boolean;
  prayers: Array<{
    prayer: PrayerType;
    titleArabic: string;
    status: PrayerStatus;
    statusArabic: string;
  }>;
}

export interface WeekDetail {
  weekKey: string;
  startDate: string;
  endDate: string;
  rangeFormattedArabic: string;
  isCurrentWeek: boolean;
  summary: WeekSummaryStats;
  days: WeekDayStatus[];
  dailyPrayerMatrix: DayPrayerRow[];
  prayerStats: WeekPrayerStat[];
  habitStats: WeekHabitStat[];
  counterStats: WeekCounterStat[];
  unrecordedNotices: Array<{
    titleArabic: string;
    unrecordedDays: number;
  }>;
  pendingReviewDays: WeekDayStatus[];
  unfinalizedPastDays: PreviousDayReviewState[];
  dynamicSummaryText: string;
}

