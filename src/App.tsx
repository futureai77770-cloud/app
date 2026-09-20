import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  Award,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  MapPin,
  Heart
} from 'lucide-react';
import {
  CounterRecord,
  DailyPrayerTimes,
  DailyReflection,
  HabitRecord,
  HabitStatus,
  NextPrayerInfo,
  PrayerRecord,
  PrayerStatus,
  PreviousDayReviewState,
  UserSettings,
  WeeklyReport
} from './types';
import { EgyptDateTimeService } from './core/datetime/EgyptDateTimeService';
import { DEFAULT_CITY, EGYPTIAN_CITIES, EgyptPrayerTimesEngine } from './core/prayer/EgyptPrayerTimesEngine';
import { NotificationService } from './core/notifications/NotificationService';
import { db } from './data/db';
import { playCelebrationChime } from './utils/audio';

// Screens & Components
import { HomeScreen } from './components/HomeScreen';
import { TasbihScreen } from './components/TasbihScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PrayerBottomSheet } from './components/PrayerBottomSheet';
import { QuranWirdDialog } from './components/QuranWirdDialog';
import { DailyReflectionSheet } from './components/DailyReflectionSheet';
import { ReviewYesterdaySheet } from './components/ReviewYesterdaySheet';
import { OnboardingModal } from './components/OnboardingModal';
import { MicroCelebration } from './components/MicroCelebration';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'tasbih' | 'reports' | 'settings'>('home');

  // Database / state
  const [settings, setSettings] = useState<UserSettings>(() => db.getUserSettings());
  const [todayKey, setTodayKey] = useState<string>(() => EgyptDateTimeService.getTodayKey());
  const [prayers, setPrayers] = useState<PrayerRecord[]>([]);
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [counters, setCounters] = useState<CounterRecord[]>([]);
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [previousDayReview, setPreviousDayReview] = useState<PreviousDayReviewState | null>(null);
  const [activeReviewState, setActiveReviewState] = useState<PreviousDayReviewState | null>(null);
  const [unfinalizedPastDays, setUnfinalizedPastDays] = useState<PreviousDayReviewState[]>([]);
  const [pendingDaysCount, setPendingDaysCount] = useState<number>(0);
  const [showYesterdayBanner, setShowYesterdayBanner] = useState<boolean>(false);

  // Prayer Calculation state
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [nextPrayerInfo, setNextPrayerInfo] = useState<NextPrayerInfo | null>(null);

  // Modals state
  const [activePrayerModal, setActivePrayerModal] = useState<PrayerRecord | null>(null);
  const [activeQuranHabit, setActiveQuranHabit] = useState<HabitRecord | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [showYesterdayModal, setShowYesterdayModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!settings.isOnboarded);

  // Celebration state
  const [celebrationState, setCelebrationState] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
  }>({
    visible: false,
    title: 'ما شاء الله 🤍',
    subtitle: 'أحسنت، خطوة مباركة في طاعة الله'
  });

  const triggerCelebration = useCallback((title: string, subtitle: string) => {
    playCelebrationChime(settings.soundEnabled);
    setCelebrationState({ visible: true, title, subtitle });
    setTimeout(() => {
      setCelebrationState((prev) => ({ ...prev, visible: false }));
    }, 3600);
  }, [settings.soundEnabled]);

  // Sync / Load data
  const loadData = useCallback(() => {
    const currentToday = EgyptDateTimeService.getTodayKey();
    setTodayKey(currentToday);

    const s = db.getUserSettings();
    setSettings(s);

    // Calculate prayer times
    const times = EgyptPrayerTimesEngine.calculatePrayerTimes(
      currentToday,
      s.cityLat,
      s.cityLng,
      s.selectedCity
    );
    setPrayerTimes(times);

    // Ensure today's records exist
    db.ensureDayInitialized(currentToday, times);

    // Fetch reactive items
    setPrayers(db.getPrayersForDay(currentToday));
    setHabits(db.getHabitsForDay(currentToday));
    setCounters(db.getCountersForDay(currentToday));
    setReflection(db.getReflectionForDay(currentToday));
    setWeeklyReports(db.getAllWeeklyReports());

    // Check pending unfinalized past days
    const yesterdayReview = db.getPreviousDayReviewState(currentToday);
    const unfinalizedPastDaysList = db.getAllUnfinalizedPastDays(currentToday);
    setUnfinalizedPastDays(unfinalizedPastDaysList);
    setPendingDaysCount(unfinalizedPastDaysList.length);

    if (unfinalizedPastDaysList.length > 0) {
      setShowYesterdayBanner(true);
      if (yesterdayReview?.needsReview) {
        setPreviousDayReview(yesterdayReview);
      } else {
        setPreviousDayReview(db.getDayReviewState(unfinalizedPastDaysList[0].dayKey));
      }
      if (s.notificationsEnabled) {
        NotificationService.sendGentleReviewReminderIfNeeded(unfinalizedPastDaysList.length);
      }
    } else {
      setShowYesterdayBanner(false);
      setPreviousDayReview(null);
    }

    // Update countdown
    const nextInfo = EgyptPrayerTimesEngine.getNextPrayerInfo(times);
    setNextPrayerInfo(nextInfo);
  }, []);

  // Initialize and check expired weeks on mount
  useEffect(() => {
    db.checkAndFinalizeExpiredWeeks();
    loadData();

    // Subscribe to DB changes
    const unsubscribe = db.subscribe(() => {
      loadData();
    });

    return () => unsubscribe();
  }, [loadData]);

  // Live timer for prayer countdown and midnight detection
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToday = EgyptDateTimeService.getTodayKey();
      if (currentToday !== todayKey && todayKey !== '') {
        // Midnight in Cairo passed
        loadData();
      } else if (prayerTimes) {
        setNextPrayerInfo(EgyptPrayerTimesEngine.getNextPrayerInfo(prayerTimes));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [todayKey, prayerTimes, loadData]);

  // Dark mode effect
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  // Neutral recording completeness count (not a score or religious rank)
  const recordedPrayersCount = useMemo(() => {
    return prayers.filter((p) => p.status !== 'UNRECORDED').length;
  }, [prayers]);

  const encouragementMessage = useMemo(() => {
    if (recordedPrayersCount === 5) return 'ما شاء الله، اكتمل تسجيل صلوات اليوم الخمس 🤍';
    if (recordedPrayersCount >= 3) return 'متابعة طيبة لصلوات اليوم بهمة وسكينة 🌿';
    if (recordedPrayersCount > 0) return 'بداية طيبة، تستكمل تسجيل صلواتك وعباداتك خطوة بخطوة 🌿';
    return 'السلام عليكم 🤍 لنبدأ يومنا بذكر الله وطاعته';
  }, [recordedPrayersCount]);

  const nextStepSuggestion = useMemo(() => {
    const unrecordedPrayer = prayers.find((p) => p.status === 'UNRECORDED');
    if (unrecordedPrayer) {
      const arNames: Record<string, string> = {
        FAJR: 'الفجر',
        DHUHR: 'الظهر',
        ASR: 'العصر',
        MAGHRIB: 'المغرب',
        ISHA: 'العشاء'
      };
      return `سجّل كيف صليت ${arNames[unrecordedPrayer.prayer] || unrecordedPrayer.prayer} اليوم.`;
    }

    const quranHabit = habits.find((h) => h.habitKey === 'quran_wird' && !h.isCompleted);
    if (quranHabit) {
      return 'أكمل وردك من القرآن الكريم اليوم.';
    }

    const istighfar = counters.find((c) => c.counterKey === 'counter_istighfar' && c.count < c.target);
    if (istighfar) {
      return `أكمل استغفار اليوم (${istighfar.count} / ${istighfar.target}).`;
    }

    const incompleteHabit = habits.find((h) => !h.isCompleted);
    if (incompleteHabit) {
      return `بقي لك ${incompleteHabit.titleArabic} اليوم.`;
    }

    return 'الحمد لله، أتممت جلّ عباداتك اليوم! بارك الله فيك.';
  }, [prayers, habits, counters]);

  // Handlers
  const handleLogPrayer = (status: PrayerStatus, reason: string | null, customReason: string | null) => {
    if (!activePrayerModal) return;
    db.updatePrayerStatus(
      todayKey,
      activePrayerModal.prayer,
      status,
      reason,
      customReason,
      activePrayerModal.scheduledTime
    );

    if (status === 'CONGREGATION') {
      triggerCelebration('تقبل الله 🕌', 'صليت في جماعة، هنيئًا لك الأجر المضاعف وسكينة المسجد');
    }
  };

  const handleToggleHabit = (habitKey: string, isCompleted: boolean) => {
    db.toggleHabit(todayKey, habitKey, isCompleted);
    if (isCompleted) {
      if (habitKey === 'quran_wird') {
        triggerCelebration('ما شاء الله 📖', 'أتممت وردك من كتاب الله المبارك');
      } else {
        triggerCelebration('الحمد لله 🌿', 'كتب الله أجرك وثبتك على طاعته');
      }
    }
  };

  const handleSaveQuranWird = (completed: boolean, notes: string | null) => {
    db.toggleHabit(todayKey, 'quran_wird', completed, notes);
    if (completed) {
      triggerCelebration('ما شاء الله 📖', 'أتممت وردك من كتاب الله المبارك');
    }
  };

  const handleIncrementCounter = (counterKey: string) => {
    const updated = db.incrementCounter(todayKey, counterKey, 1);
    if (updated.count === updated.target) {
      triggerCelebration('ما شاء الله 🤍', `أكملت ${updated.titleArabic} اليوم`);
    }
  };

  const handleCompleteCounter = (counterKey: string) => {
    const updated = db.markCounterCompleted(todayKey, counterKey, true);
    triggerCelebration('ما شاء الله 🤍', `تم تسجيل إنجاز ${updated.titleArabic} اليوم`);
  };

  const handleResetCounter = (counterKey: string) => {
    db.resetCounter(todayKey, counterKey);
  };

  const handleSaveReflection = (
    struggledHabit: string | null,
    reason: string | null,
    customReason: string | null,
    note: string | null
  ) => {
    db.saveReflection(todayKey, struggledHabit, reason, customReason, note);
    triggerCelebration('تقبل الله منك 🤍', 'حفظت محاسبة اليوم، ونسأل الله التوفيق والسداد للغد');
  };

  const handleOpenReviewForDay = (dayKey?: string) => {
    if (dayKey) {
      const st = db.getDayReviewState(dayKey);
      setActiveReviewState(st);
    } else {
      setActiveReviewState(previousDayReview || (unfinalizedPastDays.length > 0 ? unfinalizedPastDays[0] : null));
    }
    setShowYesterdayModal(true);
  };

  const handleFinalizeYesterday = (
    prayerUpdates: Record<string, PrayerStatus>,
    habitUpdates: Record<string, HabitStatus | boolean>,
    counterUpdates?: Record<string, boolean>
  ) => {
    const target = activeReviewState || previousDayReview;
    if (!target) return;
    db.finalizeDay(target.dayKey, prayerUpdates, habitUpdates, counterUpdates);
    setShowYesterdayModal(false);
    setActiveReviewState(null);
    loadData();
    triggerCelebration('تم اعتماد مراجعة اليوم 🤍', 'تقبل الله طاعتك وأعانك على يومك');
  };

  const handleCompleteOnboarding = (cityName: string, lat: number, lng: number) => {
    db.completeOnboarding(cityName, lat, lng);
    setShowOnboarding(false);
    loadData();
    triggerCelebration('أهلاً بك في أهل القرآن 🤍', 'رحلة مباركة وموفقة مع كتاب الله وسنن نبيه');
  };

  const fullArabicDate = useMemo(() => {
    return EgyptDateTimeService.formatArabicFullDate(todayKey);
  }, [todayKey]);

  const currentWeekKey = useMemo(() => {
    return EgyptDateTimeService.getWeekKeyForDate(todayKey);
  }, [todayKey]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#0A120F] text-[#13221D] dark:text-[#F1F5F3] flex flex-col font-['Cairo',sans-serif] selection:bg-[#D4EFE6] selection:text-[#0F382C]">
      {/* Micro Celebration Toast */}
      <MicroCelebration
        visible={celebrationState.visible}
        title={celebrationState.title}
        subtitle={celebrationState.subtitle}
      />

      {/* Top Navigation / App Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F1E1A]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#1E332C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#164E3D] to-[#28876B] text-white flex items-center justify-center text-xl shadow-xs">
              📖
            </div>
            <div>
              <h1 className="text-xl font-black font-amiri tracking-wide text-gray-900 dark:text-white leading-tight">
                أهل القرآن
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span>{settings.selectedCity}</span>
                <span>•</span>
                <span>توقيت مصر 🇪🇬</span>
              </div>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              id="header_sound_toggle_btn"
              type="button"
              onClick={() => {
                const newVal = !settings.soundEnabled;
                db.saveUserSettings({ ...settings, soundEnabled: newVal });
                setSettings((prev) => ({ ...prev, soundEnabled: newVal }));
              }}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182B25] transition-colors cursor-pointer"
              title={settings.soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="header_dark_mode_btn"
              type="button"
              onClick={() => {
                const newVal = !settings.isDarkMode;
                db.saveUserSettings({ ...settings, isDarkMode: newVal });
                setSettings((prev) => ({ ...prev, isDarkMode: newVal }));
              }}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182B25] transition-colors cursor-pointer"
              title="تبديل المظهر"
            >
              {settings.isDarkMode ? <Sun className="w-4 h-4 text-[#E8C97E]" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Date banner sub-bar */}
        <div className="bg-[#EDFAF5] dark:bg-[#13241F] border-t border-[#D4EFE6] dark:border-[#1E3830] px-4 py-1.5 text-center text-xs text-[#0F382C] dark:text-[#A5DCCB] font-medium">
          {fullArabicDate}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24">
        {activeTab === 'home' && (
          <HomeScreen
            fullArabicDate={fullArabicDate}
            cityName={settings.selectedCity}
            prayerTimes={prayerTimes}
            nextPrayerInfo={nextPrayerInfo}
            prayers={prayers}
            habits={habits}
            counters={counters}
            reflection={reflection}
            recordedPrayersCount={recordedPrayersCount}
            encouragementMessage={encouragementMessage}
            nextStepSuggestion={nextStepSuggestion}
            previousDayReview={previousDayReview}
            pendingDaysCount={pendingDaysCount}
            unfinalizedPastDays={unfinalizedPastDays}
            showPreviousDayBanner={showYesterdayBanner}
            soundEnabled={settings.soundEnabled}
            onLogPrayerClick={(p) => setActivePrayerModal(p)}
            onOpenQuranDialog={(h) => setActiveQuranHabit(h)}
            onToggleHabit={handleToggleHabit}
            onIncrementCounter={handleIncrementCounter}
            onCompleteCounter={handleCompleteCounter}
            onOpenReflection={() => setShowReflectionModal(true)}
            onOpenReviewYesterday={() => handleOpenReviewForDay()}
            onOpenReviewDay={(dKey) => handleOpenReviewForDay(dKey)}
            onDismissReviewYesterday={() => setShowYesterdayBanner(false)}
            onNavigateToTasbih={() => setActiveTab('tasbih')}
          />
        )}

        {activeTab === 'tasbih' && (
          <TasbihScreen
            counters={counters}
            soundEnabled={settings.soundEnabled}
            onIncrementCounter={handleIncrementCounter}
            onCompleteCounter={handleCompleteCounter}
            onResetCounter={handleResetCounter}
            onToggleSound={() => {
              const newVal = !settings.soundEnabled;
              db.saveUserSettings({ ...settings, soundEnabled: newVal });
              setSettings((prev) => ({ ...prev, soundEnabled: newVal }));
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            currentWeekKey={currentWeekKey}
            weeklyReports={weeklyReports}
            onOpenReviewYesterday={() => handleOpenReviewForDay()}
            onOpenReviewDay={(dayKey) => handleOpenReviewForDay(dayKey)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateCity={(cityName) => {
              db.updateCity(cityName);
              loadData();
            }}
            onToggleDarkMode={(isDark) => {
              db.saveUserSettings({ ...settings, isDarkMode: isDark });
              setSettings((prev) => ({ ...prev, isDarkMode: isDark }));
            }}
            onToggleSound={(enabled) => {
              db.saveUserSettings({ ...settings, soundEnabled: enabled });
              setSettings((prev) => ({ ...prev, soundEnabled: enabled }));
            }}
            onToggleNotifications={(enabled) => {
              db.saveUserSettings({ ...settings, notificationsEnabled: enabled });
              setSettings((prev) => ({ ...prev, notificationsEnabled: enabled }));
            }}
            onResetData={() => {
              db.resetAllData();
              loadData();
              setShowOnboarding(true);
            }}
            onDataRestored={() => {
              loadData();
              triggerCelebration('تمت استعادة البيانات بنجاح 🤍', 'تم دمج وتحديث سجلاتك بنجاح');
            }}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <nav
        id="bottom_nav_bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111E1A]/95 backdrop-blur-md border-t border-gray-200/70 dark:border-[#223A33] shadow-lg"
      >
        <div className="max-w-md mx-auto h-16 flex items-center justify-around px-4">
          {/* 1. Home */}
          <button
            id="nav_btn_home"
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-[#28876B] dark:text-[#A5DCCB] font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">الرئيسية</span>
          </button>

          {/* 2. Tasbih */}
          <button
            id="nav_btn_tasbih"
            type="button"
            onClick={() => setActiveTab('tasbih')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'tasbih'
                ? 'text-[#28876B] dark:text-[#A5DCCB] font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">السبحة والأذكار</span>
          </button>

          {/* 3. Reports */}
          <button
            id="nav_btn_reports"
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'reports'
                ? 'text-[#28876B] dark:text-[#A5DCCB] font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Award className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">التقارير</span>
          </button>

          {/* 4. Settings */}
          <button
            id="nav_btn_settings"
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[#28876B] dark:text-[#A5DCCB] font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">الإعدادات</span>
          </button>
        </div>
      </nav>

      {/* --- ALL POPUP MODALS --- */}
      {/* 1. Prayer Bottom Sheet */}
      {activePrayerModal && (
        <PrayerBottomSheet
          isOpen={!!activePrayerModal}
          prayerNameArabic={
            activePrayerModal.prayer === 'FAJR'
              ? 'الفجر'
              : activePrayerModal.prayer === 'DHUHR'
              ? 'الظهر'
              : activePrayerModal.prayer === 'ASR'
              ? 'العصر'
              : activePrayerModal.prayer === 'MAGHRIB'
              ? 'المغرب'
              : 'العشاء'
          }
          prayerTime={activePrayerModal.scheduledTime}
          currentStatus={activePrayerModal.status}
          currentReason={activePrayerModal.reason}
          currentCustomReason={activePrayerModal.customReason}
          onClose={() => setActivePrayerModal(null)}
          onSave={handleLogPrayer}
        />
      )}

      {/* 2. Quran Wird Dialog */}
      {activeQuranHabit && (
        <QuranWirdDialog
          isOpen={!!activeQuranHabit}
          initialCompleted={activeQuranHabit.isCompleted}
          initialNotes={activeQuranHabit.notes}
          onClose={() => setActiveQuranHabit(null)}
          onSave={handleSaveQuranWird}
        />
      )}

      {/* 3. Soul-Accounting (محاسبة النفس) Reflection Sheet */}
      <DailyReflectionSheet
        isOpen={showReflectionModal}
        prayers={prayers}
        habits={habits}
        currentStruggledHabit={reflection?.struggledHabit}
        currentReason={reflection?.struggleReason}
        currentCustomReason={reflection?.customReason}
        currentNote={reflection?.note}
        onClose={() => setShowReflectionModal(false)}
        onSave={handleSaveReflection}
      />

      {/* 4. Review Day Sheet */}
      {(activeReviewState || previousDayReview) && (
        <ReviewYesterdaySheet
          isOpen={showYesterdayModal}
          dayKey={(activeReviewState || previousDayReview)!.dayKey}
          title={
            (activeReviewState || previousDayReview)!.dayKey === EgyptDateTimeService.getYesterdayKey(todayKey)
              ? 'مراجعة أمس'
              : `مراجعة يوم ${(activeReviewState || previousDayReview)!.dateFormattedArabic}`
          }
          dateFormattedArabic={(activeReviewState || previousDayReview)!.dateFormattedArabic}
          unrecordedPrayers={(activeReviewState || previousDayReview)!.unrecordedPrayers}
          incompleteHabits={(activeReviewState || previousDayReview)!.incompleteHabits}
          allPrayers={(activeReviewState || previousDayReview)!.allPrayers}
          allHabits={(activeReviewState || previousDayReview)!.allHabits}
          allCounters={(activeReviewState || previousDayReview)!.allCounters}
          unfinalizedDays={unfinalizedPastDays}
          onSelectDayToReview={(dKey) => handleOpenReviewForDay(dKey)}
          onClose={() => {
            setShowYesterdayModal(false);
            setActiveReviewState(null);
          }}
          onConfirm={handleFinalizeYesterday}
        />
      )}

      {/* 5. First-run Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
};

export default App;
