import {
  CounterRecord,
  DailyPrayerTimes,
  DailyReflection,
  DayPrayerRow,
  DayRecord,
  HabitRecord,
  HabitStatus,
  PrayerRecord,
  PrayerStatus,
  PrayerType,
  PreviousDayReviewState,
  UserSettings,
  WeekCounterStat,
  WeekDayStatus,
  WeekDetail,
  WeekHabitStat,
  WeeklyReport,
  WeekPrayerStat,
  WeekSummaryStats
} from '../types';
import { EgyptDateTimeService } from '../core/datetime/EgyptDateTimeService';
import { DEFAULT_CITY, EGYPTIAN_CITIES, EgyptPrayerTimesEngine } from '../core/prayer/EgyptPrayerTimesEngine';
import { ALL_COUNTERS, DEFAULT_HABITS } from './defaultData';
import { getPrayerDisplayName, PRAYER_STATUS_SHORT_NAMES } from '../utils/displayNames';

const STORAGE_KEYS = {
  SETTINGS: 'ahl_quran_settings',
  PRAYERS: 'ahl_quran_prayers',
  HABITS: 'ahl_quran_habits',
  COUNTERS: 'ahl_quran_counters',
  REFLECTIONS: 'ahl_quran_reflections',
  WEEKLY_REPORTS: 'ahl_quran_weekly_reports',
  DAY_RECORDS: 'ahl_quran_day_records'
};

type ChangeListener = () => void;

class LocalDatabase {
  private listeners: Set<ChangeListener> = new Set();

  private notifyScheduled = false;

  public subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      this.listeners.forEach((l) => {
        try {
          l();
        } catch (err) {
          console.error('Error in db subscriber:', err);
        }
      });
    });
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // --- USER SETTINGS ---
  getUserSettings(): UserSettings {
    const fallback: UserSettings = {
      id: 'default',
      isDarkMode: null, // system
      notificationsEnabled: true,
      soundEnabled: true,
      selectedCity: DEFAULT_CITY.nameArabic,
      cityLat: DEFAULT_CITY.latitude,
      cityLng: DEFAULT_CITY.longitude,
      isOnboarded: false,
      lastActiveDayKey: null
    };
    return this.getItem<UserSettings>(STORAGE_KEYS.SETTINGS, fallback);
  }

  saveUserSettings(settings: UserSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  completeOnboarding(cityName: string, lat: number, lng: number): void {
    const s = this.getUserSettings();
    this.saveUserSettings({
      ...s,
      isOnboarded: true,
      selectedCity: cityName,
      cityLat: lat,
      cityLng: lng
    });
  }

  updateCity(cityName: string): void {
    const city = EGYPTIAN_CITIES.find(c => c.nameArabic === cityName) || DEFAULT_CITY;
    const s = this.getUserSettings();
    this.saveUserSettings({
      ...s,
      selectedCity: city.nameArabic,
      cityLat: city.latitude,
      cityLng: city.longitude
    });
  }

  // --- DAY INITIALIZATION ---
  ensureDayInitialized(dayKey: string, prayerTimes?: DailyPrayerTimes): void {
    // 1. Day Record
    const days = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});
    if (!days[dayKey]) {
      days[dayKey] = {
        dayKey,
        isFinalized: false,
        createdAt: Date.now()
      };
      this.setItem(STORAGE_KEYS.DAY_RECORDS, days);
    }

    // 2. Prayers
    const allPrayers = this.getItem<Record<string, PrayerRecord>>(STORAGE_KEYS.PRAYERS, {});
    const defaultPrayers: Array<{ prayer: 'FAJR' | 'DHUHR' | 'ASR' | 'MAGHRIB' | 'ISHA'; time: string }> = [
      { prayer: 'FAJR', time: prayerTimes?.fajr || '' },
      { prayer: 'DHUHR', time: prayerTimes?.dhuhr || '' },
      { prayer: 'ASR', time: prayerTimes?.asr || '' },
      { prayer: 'MAGHRIB', time: prayerTimes?.maghrib || '' },
      { prayer: 'ISHA', time: prayerTimes?.isha || '' }
    ];

    let prayersChanged = false;
    for (const p of defaultPrayers) {
      const id = `${dayKey}_${p.prayer}`;
      if (!allPrayers[id]) {
        allPrayers[id] = {
          id,
          dayKey,
          prayer: p.prayer,
          scheduledTime: p.time,
          status: 'UNRECORDED',
          reason: null,
          customReason: null,
          recordedAt: null
        };
        prayersChanged = true;
      } else if (!allPrayers[id].scheduledTime && p.time) {
        allPrayers[id].scheduledTime = p.time;
        prayersChanged = true;
      }
    }
    if (prayersChanged) {
      this.setItem(STORAGE_KEYS.PRAYERS, allPrayers);
    }

    // 3. Habits
    const allHabits = this.getItem<Record<string, HabitRecord>>(STORAGE_KEYS.HABITS, {});
    let habitsChanged = false;
    for (const def of DEFAULT_HABITS) {
      const id = `${dayKey}_${def.key}`;
      if (!allHabits[id]) {
        allHabits[id] = {
          id,
          dayKey,
          habitKey: def.key,
          titleArabic: def.titleArabic,
          isCompleted: false,
          currentValue: 0,
          targetValue: def.defaultTarget,
          unitArabic: def.unitArabic,
          notes: null,
          updatedAt: null
        };
        habitsChanged = true;
      }
    }
    if (habitsChanged) {
      this.setItem(STORAGE_KEYS.HABITS, allHabits);
    }

    // 4. Counters
    const allCounters = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
    let countersChanged = false;
    for (const def of ALL_COUNTERS) {
      const id = `${dayKey}_${def.key}`;
      if (!allCounters[id]) {
        allCounters[id] = {
          id,
          dayKey,
          counterKey: def.key,
          titleArabic: def.titleArabic,
          count: 0,
          target: def.defaultTarget,
          updatedAt: null
        };
        countersChanged = true;
      }
    }
    if (countersChanged) {
      this.setItem(STORAGE_KEYS.COUNTERS, allCounters);
    }
  }

  // --- PRAYERS ---
  getPrayersForDay(dayKey: string): PrayerRecord[] {
    const allPrayers = this.getItem<Record<string, PrayerRecord>>(STORAGE_KEYS.PRAYERS, {});
    const order: Record<string, number> = { FAJR: 1, DHUHR: 2, ASR: 3, MAGHRIB: 4, ISHA: 5 };
    const dayPrayers = Object.values(allPrayers).filter((p) => p.dayKey === dayKey);

    if (dayPrayers.length === 5) {
      return dayPrayers.sort((a, b) => (order[a.prayer] || 99) - (order[b.prayer] || 99));
    }

    const PRAYER_KEYS: Array<'FAJR' | 'DHUHR' | 'ASR' | 'MAGHRIB' | 'ISHA'> = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA'];
    const existingMap = new Map(dayPrayers.map((p) => [p.prayer, p]));

    return PRAYER_KEYS.map((pk) => {
      if (existingMap.has(pk)) {
        return existingMap.get(pk)!;
      }
      return {
        id: `${dayKey}_${pk}`,
        dayKey,
        prayer: pk,
        scheduledTime: '',
        status: 'UNRECORDED' as PrayerStatus,
        reason: null,
        customReason: null,
        recordedAt: null
      };
    });
  }

  updatePrayerStatus(
    dayKey: string,
    prayer: string,
    status: PrayerStatus,
    reason: string | null = null,
    customReason: string | null = null,
    scheduledTime: string = ''
  ): void {
    const allPrayers = this.getItem<Record<string, PrayerRecord>>(STORAGE_KEYS.PRAYERS, {});
    const id = `${dayKey}_${prayer}`;
    const isUnrecorded = status === 'UNRECORDED';
    allPrayers[id] = {
      id,
      dayKey,
      prayer: prayer as any,
      scheduledTime: scheduledTime || allPrayers[id]?.scheduledTime || '',
      status,
      reason: isUnrecorded ? null : reason,
      customReason: isUnrecorded ? null : customReason,
      recordedAt: isUnrecorded ? null : Date.now()
    };
    this.setItem(STORAGE_KEYS.PRAYERS, allPrayers);
  }

  // --- HABITS ---
  getHabitsForDay(dayKey: string): HabitRecord[] {
    const allHabits = this.getItem<Record<string, HabitRecord>>(STORAGE_KEYS.HABITS, {});
    const priorityMap: Record<string, number> = {};
    DEFAULT_HABITS.forEach((h) => {
      priorityMap[h.key] = h.priority;
    });

    const dayHabits = Object.values(allHabits).filter((h) => h.dayKey === dayKey);
    if (dayHabits.length > 0) {
      return dayHabits
        .map((h) => {
          let status: HabitStatus;
          if (h.status) {
            status = h.status;
          } else if (h.isCompleted) {
            status = 'DONE';
          } else if (h.notes === 'NOT_DONE') {
            status = 'NOT_DONE';
          } else {
            status = 'UNRECORDED';
          }
          return {
            ...h,
            status,
            isCompleted: status === 'DONE'
          };
        })
        .sort((a, b) => (priorityMap[a.habitKey] || 99) - (priorityMap[b.habitKey] || 99));
    }

    return DEFAULT_HABITS.map((def) => ({
      id: `${dayKey}_${def.key}`,
      dayKey,
      habitKey: def.key,
      titleArabic: def.titleArabic,
      isCompleted: false,
      status: 'UNRECORDED' as HabitStatus,
      currentValue: 0,
      targetValue: def.defaultTarget,
      unitArabic: def.unitArabic,
      notes: null,
      updatedAt: null
    })).sort((a, b) => (priorityMap[a.habitKey] || 99) - (priorityMap[b.habitKey] || 99));
  }

  setHabitStatus(dayKey: string, habitKey: string, status: HabitStatus, notes: string | null = null): void {
    const allHabits = this.getItem<Record<string, HabitRecord>>(STORAGE_KEYS.HABITS, {});
    const id = `${dayKey}_${habitKey}`;
    const existing = allHabits[id];
    const def = DEFAULT_HABITS.find((h) => h.key === habitKey);

    const isCompleted = status === 'DONE';
    const finalNotes =
      status === 'NOT_DONE'
        ? (notes || 'NOT_DONE')
        : (status === 'UNRECORDED' ? null : (notes !== null ? notes : (existing?.notes === 'NOT_DONE' ? null : existing?.notes)));

    allHabits[id] = {
      id,
      dayKey,
      habitKey,
      titleArabic: existing?.titleArabic || def?.titleArabic || habitKey,
      isCompleted,
      status,
      currentValue: isCompleted ? (def?.defaultTarget || 1) : 0,
      targetValue: existing?.targetValue || def?.defaultTarget || 1,
      unitArabic: existing?.unitArabic || def?.unitArabic || '',
      notes: finalNotes,
      updatedAt: Date.now()
    };
    this.setItem(STORAGE_KEYS.HABITS, allHabits);
  }

  toggleHabit(dayKey: string, habitKey: string, isCompleted: boolean, notes: string | null = null): void {
    if (isCompleted) {
      this.setHabitStatus(dayKey, habitKey, 'DONE', notes);
    } else {
      const status: HabitStatus = notes === 'NOT_DONE' ? 'NOT_DONE' : 'UNRECORDED';
      this.setHabitStatus(dayKey, habitKey, status, notes);
    }
  }

  // --- COUNTERS ---
  getCountersForDay(dayKey: string): CounterRecord[] {
    const allCounters = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
    const priorityMap: Record<string, number> = {};
    ALL_COUNTERS.forEach((c) => {
      priorityMap[c.key] = c.priority;
    });

    const dayCounters = Object.values(allCounters).filter((c) => c.dayKey === dayKey);
    if (dayCounters.length > 0) {
      return dayCounters.sort((a, b) => (priorityMap[a.counterKey] || 99) - (priorityMap[b.counterKey] || 99));
    }

    return ALL_COUNTERS.map((def) => ({
      id: `${dayKey}_${def.key}`,
      dayKey,
      counterKey: def.key,
      titleArabic: def.titleArabic,
      count: 0,
      target: def.defaultTarget,
      updatedAt: null
    })).sort((a, b) => (priorityMap[a.counterKey] || 99) - (priorityMap[b.counterKey] || 99));
  }

  incrementCounter(dayKey: string, counterKey: string, amount: number = 1): CounterRecord {
    const allCounters = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
    const id = `${dayKey}_${counterKey}`;
    const def = ALL_COUNTERS.find((c) => c.key === counterKey);
    const existing = allCounters[id];

    const currentCount = existing ? existing.count : 0;
    const target = existing ? existing.target : (def?.defaultTarget || 100);
    const title = existing ? existing.titleArabic : (def?.titleArabic || counterKey);
    const newCount = currentCount + amount;
    const isCompleted = newCount >= target;

    const updated: CounterRecord = {
      id,
      dayKey,
      counterKey,
      titleArabic: title,
      count: newCount,
      target,
      isCompleted,
      completedOutside: existing?.completedOutside || false,
      updatedAt: Date.now()
    };
    allCounters[id] = updated;
    this.setItem(STORAGE_KEYS.COUNTERS, allCounters);
    return updated;
  }

  markCounterCompleted(dayKey: string, counterKey: string, completed: boolean = true): CounterRecord {
    const allCounters = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
    const id = `${dayKey}_${counterKey}`;
    const def = ALL_COUNTERS.find((c) => c.key === counterKey);
    const existing = allCounters[id];

    const target = existing ? existing.target : (def?.defaultTarget || 100);
    const title = existing ? existing.titleArabic : (def?.titleArabic || counterKey);
    const currentCount = existing ? existing.count : 0;

    const updated: CounterRecord = {
      id,
      dayKey,
      counterKey,
      titleArabic: title,
      count: completed ? Math.max(currentCount, target) : 0,
      target,
      isCompleted: completed,
      completedOutside: completed,
      updatedAt: Date.now()
    };
    allCounters[id] = updated;
    this.setItem(STORAGE_KEYS.COUNTERS, allCounters);
    return updated;
  }

  resetCounter(dayKey: string, counterKey: string): void {
    const allCounters = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
    const id = `${dayKey}_${counterKey}`;
    if (allCounters[id]) {
      allCounters[id].count = 0;
      allCounters[id].isCompleted = false;
      allCounters[id].completedOutside = false;
      allCounters[id].updatedAt = Date.now();
      this.setItem(STORAGE_KEYS.COUNTERS, allCounters);
    }
  }

  // --- REFLECTIONS ---
  getReflectionForDay(dayKey: string): DailyReflection | null {
    const allReflections = this.getItem<Record<string, DailyReflection>>(STORAGE_KEYS.REFLECTIONS, {});
    return allReflections[dayKey] || null;
  }

  saveReflection(
    dayKey: string,
    struggledHabit: string | null,
    struggleReason: string | null,
    customReason: string | null,
    note: string | null
  ): void {
    const allReflections = this.getItem<Record<string, DailyReflection>>(STORAGE_KEYS.REFLECTIONS, {});
    allReflections[dayKey] = {
      dayKey,
      isCompleted: true,
      struggledHabit,
      struggleReason,
      customReason,
      note,
      recordedAt: Date.now()
    };
    this.setItem(STORAGE_KEYS.REFLECTIONS, allReflections);
  }

  // --- PREVIOUS DAY & PAST DAYS REVIEW ---
  getDayReviewState(dayKey: string): PreviousDayReviewState | null {
    const todayKey = EgyptDateTimeService.getTodayKey();
    if (dayKey >= todayKey) {
      return null;
    }

    const dayRecords = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});
    const dayRecord = dayRecords[dayKey];

    // If day is already finalized, no review needed
    if (dayRecord && dayRecord.isFinalized) {
      return null;
    }

    const prayers = this.getPrayersForDay(dayKey);
    const habits = this.getHabitsForDay(dayKey);
    const counters = this.getCountersForDay(dayKey);

    // If day record exists or prayers/habits exist
    if (!dayRecord && prayers.length === 0 && habits.length === 0) {
      return null;
    }

    const unrecordedPrayers = prayers.filter((p) => p.status === 'UNRECORDED');
    const incompleteHabits = habits.filter((h) => !h.isCompleted);

    const dateFormattedArabic = EgyptDateTimeService.formatArabicDayWithDate(dayKey);

    return {
      dayKey,
      dateFormattedArabic,
      allPrayers: prayers,
      allHabits: habits,
      allCounters: counters,
      unrecordedPrayers,
      incompleteHabits,
      needsReview: true,
      isFinalized: false
    };
  }

  getPreviousDayReviewState(todayKey: string): PreviousDayReviewState | null {
    const yesterdayKey = EgyptDateTimeService.getYesterdayKey(todayKey);
    return this.getDayReviewState(yesterdayKey);
  }

  getAllUnfinalizedPastDays(todayKey: string = EgyptDateTimeService.getTodayKey()): PreviousDayReviewState[] {
    const dayRecords = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});
    const allPrayers = this.getItem<Record<string, PrayerRecord>>(STORAGE_KEYS.PRAYERS, {});
    const allHabits = this.getItem<Record<string, HabitRecord>>(STORAGE_KEYS.HABITS, {});

    const dayKeysSet = new Set<string>();
    Object.keys(dayRecords).forEach((k) => dayKeysSet.add(k));
    Object.values(allPrayers).forEach((p) => dayKeysSet.add(p.dayKey));
    Object.values(allHabits).forEach((h) => dayKeysSet.add(h.dayKey));

    // Also include yesterday if it falls within recent past
    const yesterday = EgyptDateTimeService.getYesterdayKey(todayKey);
    dayKeysSet.add(yesterday);

    // If there are recorded past days, fill any gap days between the earliest recorded day (up to 14 days max) and yesterday
    const existingPastDays = Array.from(dayKeysSet).filter((d) => d < todayKey).sort();
    if (existingPastDays.length > 0) {
      const earliest = existingPastDays[0];
      const maxLookbackDate = EgyptDateTimeService.parseDayKey(todayKey);
      maxLookbackDate.setDate(maxLookbackDate.getDate() - 14);
      const maxLookbackKey = EgyptDateTimeService.toDayKey(maxLookbackDate);

      const startKey = earliest > maxLookbackKey ? earliest : maxLookbackKey;
      let curr = EgyptDateTimeService.parseDayKey(startKey);
      const yesterdayDate = EgyptDateTimeService.parseDayKey(yesterday);
      while (curr <= yesterdayDate) {
        dayKeysSet.add(EgyptDateTimeService.toDayKey(curr));
        curr.setDate(curr.getDate() + 1);
      }
    }

    const pastDaysList = Array.from(dayKeysSet)
      .filter((d) => d < todayKey)
      .sort((a, b) => b.localeCompare(a)); // Newest to oldest (الأحدث إلى الأقدم)

    const result: PreviousDayReviewState[] = [];
    for (const d of pastDaysList) {
      const state = this.getDayReviewState(d);
      if (state) {
        result.push(state);
      }
    }
    return result;
  }

  finalizeDay(
    dayKey: string,
    prayerUpdates: Record<string, PrayerStatus> = {},
    habitUpdates: Record<string, HabitStatus | boolean> = {},
    counterUpdates: Record<string, boolean> = {}
  ): void {
    // 1. Apply prayers (only update if user changed status, never overwrite unrecorded into missed without consent)
    const prayers = this.getPrayersForDay(dayKey);
    for (const p of prayers) {
      const updatedStatus = prayerUpdates[p.prayer];
      if (updatedStatus && updatedStatus !== p.status) {
        this.updatePrayerStatus(dayKey, p.prayer, updatedStatus, p.reason, p.customReason, p.scheduledTime);
      }
    }

    // 2. Apply habits preserving explicit 3-state semantics (DONE, NOT_DONE, UNRECORDED)
    for (const [habitKey, choice] of Object.entries(habitUpdates)) {
      if (choice === 'DONE' || choice === true) {
        this.setHabitStatus(dayKey, habitKey, 'DONE');
      } else if (choice === 'NOT_DONE') {
        this.setHabitStatus(dayKey, habitKey, 'NOT_DONE');
      } else if (choice === 'UNRECORDED') {
        this.setHabitStatus(dayKey, habitKey, 'UNRECORDED');
      } else if (choice === false) {
        // legacy fallback if raw boolean false was supplied
        this.setHabitStatus(dayKey, habitKey, 'NOT_DONE');
      }
    }

    // 3. Apply counters
    for (const [counterKey, isDone] of Object.entries(counterUpdates)) {
      if (isDone) {
        this.markCounterCompleted(dayKey, counterKey, true);
      }
    }

    // 4. Mark finalized for the target day ONLY - preserves all data, does not touch today's records
    const dayRecords = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});
    dayRecords[dayKey] = {
      dayKey,
      isFinalized: true,
      finalizedAt: Date.now(),
      createdAt: dayRecords[dayKey]?.createdAt || Date.now()
    };
    this.setItem(STORAGE_KEYS.DAY_RECORDS, dayRecords);
  }

  // --- WEEKLY FINALIZATION & REPORTS ---
  getAllWeeklyReports(): WeeklyReport[] {
    const all = this.getItem<Record<string, WeeklyReport>>(STORAGE_KEYS.WEEKLY_REPORTS, {});
    return Object.values(all).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  }

  getWeeklyReport(weekKey: string): WeeklyReport | null {
    const all = this.getItem<Record<string, WeeklyReport>>(STORAGE_KEYS.WEEKLY_REPORTS, {});
    return all[weekKey] || null;
  }

  /**
   * Checks past weeks and generates finalized reports if expired.
   */
  checkAndFinalizeExpiredWeeks(): void {
    const todayKey = EgyptDateTimeService.getTodayKey();
    const currentWeekKey = EgyptDateTimeService.getWeekKeyForDate(todayKey);

    // Collect all day keys from stored data
    const allDayRecords = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});
    const recordedDays = Object.keys(allDayRecords);
    if (recordedDays.length === 0) return;

    const weeksToProcess = new Set<string>();
    recordedDays.forEach((dayKey) => {
      const wKey = EgyptDateTimeService.getWeekKeyForDate(dayKey);
      if (wKey !== currentWeekKey && EgyptDateTimeService.isWeekExpired(wKey, todayKey)) {
        weeksToProcess.add(wKey);
      }
    });

    const existingReports = this.getItem<Record<string, WeeklyReport>>(STORAGE_KEYS.WEEKLY_REPORTS, {});

    weeksToProcess.forEach((weekKey) => {
      if (!existingReports[weekKey]) {
        this.generateWeeklyReportForWeek(weekKey);
      }
    });
  }

  private generateWeeklyReportForWeek(weekKey: string): void {
    const days = EgyptDateTimeService.getDaysForWeekKey(weekKey);
    const allPrayers = this.getItem<Record<string, PrayerRecord>>(STORAGE_KEYS.PRAYERS, {});
    const allHabits = this.getItem<Record<string, HabitRecord>>(STORAGE_KEYS.HABITS, {});
    const allCounters = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
    const allReflections = this.getItem<Record<string, DailyReflection>>(STORAGE_KEYS.REFLECTIONS, {});

    const weekPrayers = Object.values(allPrayers).filter((p) => days.includes(p.dayKey));
    const weekHabits = Object.values(allHabits).filter((h) => days.includes(h.dayKey));
    const weekCounters = Object.values(allCounters).filter((c) => days.includes(c.dayKey));
    const weekReflections = Object.values(allReflections).filter((r) => days.includes(r.dayKey));

    const totalPossiblePrayers = 35; // 7 days * 5 prayers
    const congregationCount = weekPrayers.filter((p) => p.status === 'CONGREGATION').length;
    const individualCount = weekPrayers.filter((p) => p.status === 'INDIVIDUAL').length;
    const missedCount = weekPrayers.filter((p) => p.status === 'MISSED').length;
    const unrecordedCount = Math.max(0, totalPossiblePrayers - (congregationCount + individualCount + missedCount));

    const congregationRate = Math.round((congregationCount / totalPossiblePrayers) * 100);
    const individualRate = Math.round((individualCount / totalPossiblePrayers) * 100);

    const totalHabits = weekHabits.length;
    const completedHabits = weekHabits.filter((h) => h.isCompleted).length;
    const completedHabitsRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    const quranDays = weekHabits.filter((h) => h.habitKey === 'quran_wird' && h.isCompleted).length;
    const totalTasbih = weekCounters.reduce((sum, c) => sum + (c.count || 0), 0);

    // Find top struggled habits
    const struggles: Record<string, number> = {};
    weekReflections.forEach((r) => {
      if (r.struggledHabit) {
        struggles[r.struggledHabit] = (struggles[r.struggledHabit] || 0) + 1;
      }
    });
    const sortedStruggles = Object.entries(struggles)
      .sort((a, b) => b[1] - a[1])
      .map(([habit, count]) => ({ habit, count }));

    let encouragement = 'بارك الله في أسبوعك وطاعاتك! بداية أسبوع جديد بهمة وسكينة 🤍';
    if (congregationRate >= 70) {
      encouragement = 'ما شاء الله، أسبوع مبارك مشرق بصلوات الجماعة والسكينة في بيوت الله 🕌🤍';
    } else if (completedHabitsRate >= 70) {
      encouragement = 'ثبات جميل وإنجاز عالٍ في السنن والعبادات، ثبتك الله وزادك فضلاً 🌿';
    } else if (missedCount > 10) {
      encouragement = 'لا تحزن على ما فات، التوبة والاستدراك باب رحمة واسع، ولنبدأ أسبوعنا الجديد بنية نقية وعزم صادق 🤍';
    }

    const report: WeeklyReport = {
      weekKey,
      startDate: days[0],
      endDate: days[6],
      finalizedAt: Date.now(),
      congregationRate,
      individualRate,
      missedPrayersCount: missedCount,
      unrecordedPrayersCount: unrecordedCount,
      completedHabitsRate,
      totalQuranDays: quranDays,
      totalTasbihCount: totalTasbih,
      topStruggledHabitsJson: JSON.stringify(sortedStruggles),
      weeklyEncouragement: encouragement
    };

    const existingReports = this.getItem<Record<string, WeeklyReport>>(STORAGE_KEYS.WEEKLY_REPORTS, {});
    existingReports[weekKey] = report;
    this.setItem(STORAGE_KEYS.WEEKLY_REPORTS, existingReports);
  }

  // --- WEEKLY DASHBOARD (Consistency without shame) ---
  getWeekDetail(weekKey: string): WeekDetail {
    const days = EgyptDateTimeService.getDaysForWeekKey(weekKey);
    const todayKey = EgyptDateTimeService.getTodayKey();
    const currentWeekKey = EgyptDateTimeService.getWeekKeyForDate(todayKey);
    const isCurrentWeek = weekKey === currentWeekKey;

    const dayRecords = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});

    // Compute day statuses
    const dayStatuses: WeekDayStatus[] = days.map((dayKey) => {
      const isToday = dayKey === todayKey;
      const isFuture = dayKey > todayKey;
      const rec = dayRecords[dayKey];
      const isFinalized = rec?.isFinalized || false;
      const isPendingReview = !isFuture && !isToday && !isFinalized;
      const dayNameArabic = EgyptDateTimeService.getDayNameArabic(dayKey);
      const dateFormatted = EgyptDateTimeService.formatArabicShortDate(dayKey);

      return {
        dayKey,
        dayNameArabic,
        dateFormatted,
        isFinalized,
        isPendingReview,
        isToday,
        isFuture
      };
    });

    const pendingReviewDays = dayStatuses.filter((d) => d.isPendingReview);

    // Days to include in counting (days that have arrived: <= today)
    const elapsedDays = days.filter((d) => d <= todayKey);
    const totalElapsedCount = elapsedDays.length || 1;

    // Gather records for the week
    const weekPrayers: PrayerRecord[] = [];
    const weekHabits: HabitRecord[] = [];
    const weekCounters: CounterRecord[] = [];

    for (const d of elapsedDays) {
      weekPrayers.push(...this.getPrayersForDay(d));
      weekHabits.push(...this.getHabitsForDay(d));
      weekCounters.push(...this.getCountersForDay(d));
    }

    // 1. Prayers (الفجر، الظهر، العصر، المغرب، العشاء)
    const PRAYER_KEYS: PrayerType[] = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA'];
    const prayerStats: WeekPrayerStat[] = PRAYER_KEYS.map((pk) => {
      const records = weekPrayers.filter((p) => p.prayer === pk);
      const congregationDays = records.filter((p) => p.status === 'CONGREGATION').length;
      const individualDays = records.filter((p) => p.status === 'INDIVIDUAL').length;
      const missedDays = records.filter((p) => p.status === 'MISSED').length;
      const unrecordedDays = totalElapsedCount - (congregationDays + individualDays + missedDays);

      return {
        prayer: pk,
        titleArabic: getPrayerDisplayName(pk),
        recordedDays: congregationDays + individualDays + missedDays,
        congregationDays,
        individualDays,
        missedDays,
        unrecordedDays: Math.max(0, unrecordedDays)
      };
    });

    // Daily prayer matrix for table/grid view
    const dailyPrayerMatrix: DayPrayerRow[] = elapsedDays.map((dayKey) => {
      const dayPrs = this.getPrayersForDay(dayKey);
      const prMap: Record<string, PrayerRecord> = {};
      dayPrs.forEach((p) => {
        prMap[p.prayer] = p;
      });

      const prRows = PRAYER_KEYS.map((pk) => {
        const pRec = prMap[pk];
        const status: PrayerStatus = pRec ? pRec.status : 'UNRECORDED';
        return {
          prayer: pk,
          titleArabic: getPrayerDisplayName(pk),
          status,
          statusArabic: PRAYER_STATUS_SHORT_NAMES[status] || 'غير مسجل'
        };
      });

      const rec = dayRecords[dayKey];
      const isFinalized = rec?.isFinalized || false;
      const isPendingReview = dayKey < todayKey && !isFinalized;

      return {
        dayKey,
        dayNameArabic: EgyptDateTimeService.getDayNameArabic(dayKey),
        dateFormatted: EgyptDateTimeService.formatArabicDayWithDate(dayKey),
        isToday: dayKey === todayKey,
        isPendingReview,
        isFinalized,
        prayers: prRows
      };
    });

    // 2. Habits (ورد القرآن، الوتر، قيام الليل، الضحى، أذكار النوم، الدعاء...)
    const habitStats: WeekHabitStat[] = DEFAULT_HABITS.map((def) => {
      const records = weekHabits.filter((h) => h.habitKey === def.key && h.isCompleted);
      const recordedDays = records.length;
      const unrecordedDays = Math.max(0, totalElapsedCount - recordedDays);

      return {
        habitKey: def.key,
        titleArabic: def.titleArabic,
        recordedDays,
        unrecordedDays
      };
    });

    // 3. Counters (الاستغفار، التسبيح، الصلاة على النبي...)
    const counterStats: WeekCounterStat[] = ALL_COUNTERS.map((def) => {
      const records = weekCounters.filter((c) => c.counterKey === def.key);
      const totalCount = records.reduce((sum, c) => sum + (c.count || 0), 0);
      const recordedDays = records.filter((c) => c.isCompleted || (c.count || 0) > 0).length;

      return {
        counterKey: def.key,
        titleArabic: def.titleArabic,
        totalCount,
        recordedDays
      };
    });

    // 4. Gentle notices: items with high unrecorded days among elapsed days (>= 2 days unrecorded)
    const unrecordedNotices: Array<{ titleArabic: string; unrecordedDays: number }> = [];
    habitStats.forEach((h) => {
      if (h.unrecordedDays >= 2) {
        unrecordedNotices.push({
          titleArabic: h.titleArabic,
          unrecordedDays: h.unrecordedDays
        });
      }
    });

    // 5. Weekly summary card stats
    let recordedDaysCount = 0;
    for (const d of elapsedDays) {
      const prs = weekPrayers.filter((p) => p.dayKey === d && p.status !== 'UNRECORDED');
      const hbs = weekHabits.filter((h) => h.dayKey === d && h.isCompleted);
      const cnts = weekCounters.filter((c) => c.dayKey === d && ((c.count || 0) > 0 || c.isCompleted));
      if (prs.length > 0 || hbs.length > 0 || cnts.length > 0) {
        recordedDaysCount++;
      }
    }

    const finalizedDaysCount = elapsedDays.filter((d) => dayRecords[d]?.isFinalized).length;
    const pendingReviewDaysCount = pendingReviewDays.length;
    const recordedPrayersCount = weekPrayers.filter((p) => p.status !== 'UNRECORDED').length;
    const recordedHabitsCount = weekHabits.filter((h) => h.isCompleted).length;

    const summary: WeekSummaryStats = {
      recordedDaysCount,
      finalizedDaysCount,
      pendingReviewDaysCount,
      recordedPrayersCount,
      recordedHabitsCount
    };

    // 6. Dynamic calm summary text (Consistency without shame)
    let dynamicSummaryText = '';
    if (pendingReviewDaysCount === 0) {
      dynamicSummaryText =
        'ما شاء الله، هذا الأسبوع أداؤك مسجل بنظام وهدوء. جميع الأيام السابقة محسومة ومحفوظة، بارك الله في أوقاتك وطاعاتك 🤍';
    } else if (pendingReviewDaysCount === 1) {
      const dayName = pendingReviewDays[0].dayNameArabic;
      dynamicSummaryText = `هذا الأسبوع لديك أيام مسجلة بهدوء وسكينة، ويوم ${dayName} ما زال بانتظار المراجعة. راجعه عندما يتوفر لك الوقت وسجل ما تتذكره منه 🤍`;
    } else {
      dynamicSummaryText = `هذا الأسبوع لديك أيام مسجلة بشكل طيب، وهناك ${pendingReviewDaysCount} أيام ما زالت تحتاج إلى مراجعة. راجع الأيام غير المسجلة بهدوء عندما يتوفر لك وقت فراغ، وسجّل ما تتذكره منها دون أي ضغط 🤍`;
    }

    const startDate = days[0];
    const endDate = days[6];
    const rangeFormattedArabic = EgyptDateTimeService.formatWeekRangeArabic(weekKey);

    // Get all unfinalized past days from db
    const unfinalizedPastDays = this.getAllUnfinalizedPastDays(todayKey);

    return {
      weekKey,
      startDate,
      endDate,
      rangeFormattedArabic,
      isCurrentWeek,
      summary,
      days: dayStatuses,
      dailyPrayerMatrix,
      prayerStats,
      habitStats,
      counterStats,
      unrecordedNotices,
      pendingReviewDays,
      unfinalizedPastDays,
      dynamicSummaryText
    };
  }

  // --- BACKUP & RESET ---
  exportAllData(): string {
    const data = {
      settings: this.getItem(STORAGE_KEYS.SETTINGS, null),
      prayers: this.getItem(STORAGE_KEYS.PRAYERS, {}),
      habits: this.getItem(STORAGE_KEYS.HABITS, {}),
      counters: this.getItem(STORAGE_KEYS.COUNTERS, {}),
      reflections: this.getItem(STORAGE_KEYS.REFLECTIONS, {}),
      weeklyReports: this.getItem(STORAGE_KEYS.WEEKLY_REPORTS, {}),
      dayRecords: this.getItem(STORAGE_KEYS.DAY_RECORDS, {})
    };
    return JSON.stringify(data, null, 2);
  }

  restoreAllData(jsonStr: string): { success: boolean; message: string } {
    try {
      if (!jsonStr || typeof jsonStr !== 'string') {
        return { success: false, message: 'ملف النسخة الاحتياطية فارغ أو غير صالح' };
      }

      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false, message: 'صيغة ملف النسخة الاحتياطية غير صالحة' };
      }

      let restoredSectionsCount = 0;

      // 1. Day Records
      if (parsed.dayRecords && typeof parsed.dayRecords === 'object' && !Array.isArray(parsed.dayRecords)) {
        const existing = this.getItem<Record<string, DayRecord>>(STORAGE_KEYS.DAY_RECORDS, {});
        const merged = { ...existing, ...parsed.dayRecords };
        this.setItem(STORAGE_KEYS.DAY_RECORDS, merged);
        restoredSectionsCount++;
      }

      // 2. Prayers
      if (parsed.prayers && typeof parsed.prayers === 'object' && !Array.isArray(parsed.prayers)) {
        const existing = this.getItem<Record<string, PrayerRecord>>(STORAGE_KEYS.PRAYERS, {});
        const merged = { ...existing, ...parsed.prayers };
        this.setItem(STORAGE_KEYS.PRAYERS, merged);
        restoredSectionsCount++;
      }

      // 3. Habits
      if (parsed.habits && typeof parsed.habits === 'object' && !Array.isArray(parsed.habits)) {
        const existing = this.getItem<Record<string, HabitRecord>>(STORAGE_KEYS.HABITS, {});
        const merged = { ...existing, ...parsed.habits };
        this.setItem(STORAGE_KEYS.HABITS, merged);
        restoredSectionsCount++;
      }

      // 4. Counters
      if (parsed.counters && typeof parsed.counters === 'object' && !Array.isArray(parsed.counters)) {
        const existing = this.getItem<Record<string, CounterRecord>>(STORAGE_KEYS.COUNTERS, {});
        const merged = { ...existing, ...parsed.counters };
        this.setItem(STORAGE_KEYS.COUNTERS, merged);
        restoredSectionsCount++;
      }

      // 5. Reflections
      if (parsed.reflections && typeof parsed.reflections === 'object' && !Array.isArray(parsed.reflections)) {
        const existing = this.getItem<Record<string, DailyReflection>>(STORAGE_KEYS.REFLECTIONS, {});
        const merged = { ...existing, ...parsed.reflections };
        this.setItem(STORAGE_KEYS.REFLECTIONS, merged);
        restoredSectionsCount++;
      }

      // 6. Weekly Reports
      if (parsed.weeklyReports && typeof parsed.weeklyReports === 'object' && !Array.isArray(parsed.weeklyReports)) {
        const existing = this.getItem<Record<string, WeeklyReport>>(STORAGE_KEYS.WEEKLY_REPORTS, {});
        const merged = { ...existing, ...parsed.weeklyReports };
        this.setItem(STORAGE_KEYS.WEEKLY_REPORTS, merged);
        restoredSectionsCount++;
      }

      // 7. Settings
      if (parsed.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings)) {
        const currentSettings = this.getUserSettings();
        const mergedSettings = { ...currentSettings, ...parsed.settings };
        this.setItem(STORAGE_KEYS.SETTINGS, mergedSettings);
        restoredSectionsCount++;
      }

      if (restoredSectionsCount === 0) {
        return { success: false, message: 'الملف لا يحتوي على بيانات تطبيق أهل القرآن' };
      }

      this.notify();
      return { success: true, message: 'تم استيراد واستعادة النسخة الاحتياطية بنجاح 🤍' };
    } catch (err) {
      console.error('Failed to restore backup:', err);
      return { success: false, message: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية' };
    }
  }

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRAYERS);
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.COUNTERS);
    localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DAY_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.notify();
  }
}

export const db = new LocalDatabase();
