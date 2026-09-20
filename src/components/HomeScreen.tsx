import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Star,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  Heart,
  Plus,
  Compass
} from 'lucide-react';
import {
  CounterRecord,
  DailyPrayerTimes,
  DailyReflection,
  HabitRecord,
  NextPrayerInfo,
  PrayerRecord,
  PrayerStatus,
  PreviousDayReviewState
} from '../types';
import { playTasbihClick } from '../utils/audio';

interface HomeScreenProps {
  fullArabicDate: string;
  cityName: string;
  prayerTimes: DailyPrayerTimes | null;
  nextPrayerInfo: NextPrayerInfo | null;
  prayers: PrayerRecord[];
  habits: HabitRecord[];
  counters: CounterRecord[];
  reflection: DailyReflection | null;
  recordedPrayersCount: number;
  encouragementMessage: string;
  nextStepSuggestion: string;
  previousDayReview: PreviousDayReviewState | null;
  pendingDaysCount?: number;
  unfinalizedPastDays?: PreviousDayReviewState[];
  showPreviousDayBanner: boolean;
  soundEnabled: boolean;
  onLogPrayerClick: (prayer: PrayerRecord) => void;
  onOpenQuranDialog: (habit: HabitRecord) => void;
  onToggleHabit: (habitKey: string, isCompleted: boolean) => void;
  onIncrementCounter: (counterKey: string) => void;
  onCompleteCounter?: (counterKey: string) => void;
  onOpenReflection: () => void;
  onOpenReviewYesterday: () => void;
  onOpenReviewDay?: (dayKey: string) => void;
  onDismissReviewYesterday: () => void;
  onNavigateToTasbih: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  fullArabicDate,
  cityName,
  prayerTimes,
  nextPrayerInfo,
  prayers,
  habits,
  counters,
  reflection,
  recordedPrayersCount,
  encouragementMessage,
  nextStepSuggestion,
  previousDayReview,
  pendingDaysCount = 0,
  unfinalizedPastDays = [],
  showPreviousDayBanner,
  soundEnabled,
  onLogPrayerClick,
  onOpenQuranDialog,
  onToggleHabit,
  onIncrementCounter,
  onCompleteCounter,
  onOpenReflection,
  onOpenReviewYesterday,
  onOpenReviewDay,
  onDismissReviewYesterday,
  onNavigateToTasbih
}) => {
  const prayerNamesArabic: Record<string, string> = {
    FAJR: 'الفجر',
    DHUHR: 'الظهر',
    ASR: 'العصر',
    MAGHRIB: 'المغرب',
    ISHA: 'العشاء'
  };

  const habitIcons: Record<string, React.ReactNode> = {
    quran_wird: <BookOpen className="w-5 h-5 text-[#1E8258]" />,
    duha_prayer: <Sun className="w-5 h-5 text-[#C9A24D]" />,
    sleep_azkar: <Moon className="w-5 h-5 text-[#327A8A]" />,
    dua_daily: <Heart className="w-5 h-5 text-[#B3534B]" />,
    witr_prayer: <Star className="w-5 h-5 text-[#C9A24D]" />,
    night_prayer: <Moon className="w-5 h-5 text-[#164E3D]" />
  };

  const isMultiplePending = pendingDaysCount > 1;

  return (
    <div id="home_screen" className="space-y-6 pb-12">
      {/* 1. Review Pending Days Banner (if needed) */}
      {showPreviousDayBanner && previousDayReview && (
        <div
          id="previous_day_banner"
          className="bg-gradient-to-r from-[#164E3D] to-[#0F382C] text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-[#28876B]/30 flex flex-col gap-3 animate-in slide-in-from-top duration-300"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5 text-[#E8C97E]" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">
                  {isMultiplePending
                    ? `عندك ${pendingDaysCount} أيام سابقة محتاجة مراجعة 🤍`
                    : 'عندك يوم محتاج مراجعة 🤍'}
                </h4>
                <p className="text-xs text-white/80 mt-0.5">
                  {isMultiplePending
                    ? `لديك ${pendingDaysCount} أيام سابقة ما زالت بعض بياناتها تحتاج إلى تسجيل. سجّلها بهدوء دون أي لوم.`
                    : `لسه ما سجلتش كل اللي حصل في يوم (${previousDayReview.dateFormattedArabic}). سجّله بهدوء واطمئنان دون لوم.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                id="dismiss_yesterday_banner_btn"
                type="button"
                onClick={onDismissReviewYesterday}
                className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                لاحقًا
              </button>
              <button
                id="open_yesterday_review_btn"
                type="button"
                onClick={() => {
                  if (unfinalizedPastDays && unfinalizedPastDays.length > 0 && onOpenReviewDay) {
                    onOpenReviewDay(unfinalizedPastDays[0].dayKey);
                  } else {
                    onOpenReviewYesterday();
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8C97E] text-[#0A241C] hover:bg-[#F3DC9B] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isMultiplePending ? 'مراجعة الأيام' : 'مراجعة اليوم'}</span>
              </button>
            </div>
          </div>

          {/* Multiple Unresolved Days Selector Chips */}
          {isMultiplePending && unfinalizedPastDays && unfinalizedPastDays.length > 1 && (
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[11px] text-white/70 font-medium">
                اختر اليوم الذي تريد مراجعته الآن مباشرة دون ترتيب:
              </span>
              <div className="flex flex-wrap gap-2">
                {unfinalizedPastDays.map((d) => (
                  <button
                    key={d.dayKey}
                    type="button"
                    onClick={() => {
                      if (onOpenReviewDay) onOpenReviewDay(d.dayKey);
                      else onOpenReviewYesterday();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer flex items-center gap-2 border border-white/10"
                  >
                    <span>📅 {d.dateFormattedArabic}</span>
                    {d.unrecordedPrayers.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E8C97E]/25 text-[#E8C97E] font-bold">
                        {d.unrecordedPrayers.length} غير مسجلة
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Next Prayer Hero Card */}
      {nextPrayerInfo && prayerTimes && (
        <div
          id="next_prayer_hero"
          className="relative overflow-hidden bg-gradient-to-br from-[#0F382C] via-[#164E3D] to-[#1E6B54] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#28876B]/40"
        >
          {/* Islamic Geometric Background Accent */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C9A24D]/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#E8C97E] text-xs font-medium backdrop-blur-sm mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>الصلاة القادمة</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-amiri tracking-wide">
                صلاة {nextPrayerInfo.nextPrayerArabic}
              </h2>
              <p className="text-sm text-white/80 mt-1 flex items-center gap-2">
                <span>موعد الأذان: <strong className="text-white text-base">{nextPrayerInfo.timeString}</strong></span>
                <span>•</span>
                <span>{cityName}</span>
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="bg-black/25 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 text-center md:text-left self-start md:self-auto">
              <span className="text-[11px] text-white/70 block uppercase tracking-wider">متبقي على الأذان</span>
              <span className="text-2xl sm:text-3xl font-black text-[#E8C97E] font-mono tracking-tight dir-ltr">
                {nextPrayerInfo.formattedCountdown}
              </span>
            </div>
          </div>

          {/* Progress bar between prayers */}
          <div className="relative z-10 mt-5">
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#C9A24D] to-[#E8C97E] h-full rounded-full transition-all duration-500"
                style={{ width: `${nextPrayerInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Horizontal mini prayer timetable */}
          <div className="relative z-10 grid grid-cols-5 gap-1 sm:gap-2 mt-5 pt-5 border-t border-white/15 text-center">
            {[
              { key: 'FAJR', label: 'الفجر', time: prayerTimes.fajr },
              { key: 'DHUHR', label: 'الظهر', time: prayerTimes.dhuhr },
              { key: 'ASR', label: 'العصر', time: prayerTimes.asr },
              { key: 'MAGHRIB', label: 'المغرب', time: prayerTimes.maghrib },
              { key: 'ISHA', label: 'العشاء', time: prayerTimes.isha }
            ].map((p) => {
              const isNext = nextPrayerInfo.nextPrayer === p.key;
              return (
                <div
                  key={p.key}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                    isNext
                      ? 'bg-[#E8C97E] text-[#0A241C] font-bold shadow-md'
                      : 'bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs block font-medium">{p.label}</span>
                  <span className="text-xs sm:text-sm font-semibold font-mono">{p.time}</span>
                </div>
              );
            })}
          </div>

          {/* Night hours strip: Midnight & Last Third */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-white/75 mt-3 pt-2 border-t border-white/10">
            <span>
              الشروق: <strong className="text-white font-mono">{prayerTimes.sunrise}</strong>
            </span>
            <span>
              منتصف الليل: <strong className="text-white font-mono">{prayerTimes.midnight}</strong>
            </span>
            <span>
              الثلث الأخير (السحر): <strong className="text-white font-mono">{prayerTimes.lastThird}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. Daily Prayer Recording Completeness & Encouragement Card */}
      <div
        id="daily_progress_card"
        className="bg-white dark:bg-[#111E1A] rounded-2xl p-5 shadow-xs border border-gray-100 dark:border-[#223A33]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C9A24D]" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              متابعة صلوات اليوم
            </h3>
          </div>
          <span className="text-sm font-bold text-[#28876B] dark:text-[#A5DCCB]">
            سُجلت {recordedPrayersCount} من 5 صلوات
          </span>
        </div>

        {/* 5-segment indicator for the 5 daily prayers */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {[0, 1, 2, 3, 4].map((idx) => {
            const isRecorded = idx < recordedPrayersCount;
            return (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isRecorded
                    ? 'bg-[#28876B] dark:bg-[#3DA384]'
                    : 'bg-gray-100 dark:bg-[#182B25]'
                }`}
              />
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {encouragementMessage}
          </p>
          <span className="inline-flex items-center gap-1 text-[#28876B] dark:text-[#3DA384] font-semibold bg-[#E6F6EE] dark:bg-[#164E3D]/40 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {nextStepSuggestion}
          </span>
        </div>
      </div>

      {/* 4. Five Daily Prayers Section */}
      <div id="prayers_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>الصلوات المفروضة</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              (صلِ في جماعة لعظيم الأجر)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {prayers.map((prayer) => {
            const prayerNameAr = prayerNamesArabic[prayer.prayer] || prayer.prayer;
            const status = prayer.status;

            let badgeStyle = 'bg-gray-100 dark:bg-[#182B25] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#223A33]';
            let badgeText = 'لم تسجل بعد';

            if (status === 'CONGREGATION') {
              badgeStyle = 'bg-[#E6F6EE] dark:bg-[#164E3D]/50 text-[#1E8258] dark:text-[#A5DCCB] border-[#1E8258]/30 font-bold';
              badgeText = 'جماعة 🕌';
            } else if (status === 'INDIVIDUAL') {
              badgeStyle = 'bg-[#E6F3F6] dark:bg-[#1b3d45]/50 text-[#327A8A] dark:text-[#4fa7b8] border-[#327A8A]/30 font-bold';
              badgeText = 'منفرد ✓';
            } else if (status === 'MISSED') {
              badgeStyle = 'bg-[#FDECEB] dark:bg-[#48201d]/50 text-[#B3534B] dark:text-[#db776f] border-[#B3534B]/30 font-bold';
              badgeText = 'لم أصلِّ ✕';
            }

            return (
              <div
                key={prayer.id}
                id={`prayer_card_${prayer.prayer.toLowerCase()}`}
                onClick={() => onLogPrayerClick(prayer)}
                className="bg-white dark:bg-[#111E1A] rounded-2xl p-4 border border-gray-100 dark:border-[#223A33] shadow-xs hover:border-[#28876B]/50 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-gray-900 dark:text-white group-hover:text-[#28876B] transition-colors">
                    {prayerNameAr}
                  </span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {prayer.scheduledTime}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-xl border ${badgeStyle}`}>
                    {badgeText}
                  </span>
                  <span className="text-xs text-[#28876B] dark:text-[#3DA384] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    تسجيل
                  </span>
                </div>

                {prayer.reason && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 truncate">
                    {prayer.reason} {prayer.customReason ? `(${prayer.customReason})` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Daily Habits & Sunnahs */}
      <div id="habits_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            السنن والعبادات اليومية
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {habits.filter((h) => h.isCompleted).length} من {habits.length} منجز
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {habits.map((habit) => {
            const isQuran = habit.habitKey === 'quran_wird';
            const icon = habitIcons[habit.habitKey] || <Star className="w-5 h-5 text-[#28876B]" />;

            return (
              <div
                key={habit.id}
                id={`habit_card_${habit.habitKey}`}
                className={`bg-white dark:bg-[#111E1A] rounded-2xl p-4 border transition-all flex items-center justify-between shadow-xs ${
                  habit.isCompleted
                    ? 'border-[#28876B]/40 bg-[#F8FAF9] dark:bg-[#142621]'
                    : 'border-gray-100 dark:border-[#223A33]'
                }`}
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => {
                    if (isQuran) {
                      onOpenQuranDialog(habit);
                    } else {
                      onToggleHabit(habit.habitKey, !habit.isCompleted);
                    }
                  }}
                >
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#182B25] shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        habit.isCompleted
                          ? 'text-[#1E8258] dark:text-[#3DA384] line-through decoration-[#1E8258]/40'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {habit.titleArabic}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {isQuran && habit.notes
                        ? habit.notes
                        : habit.isCompleted
                        ? 'تم إنجازه والحمد لله'
                        : habit.unitArabic}
                    </p>
                  </div>
                </div>

                {isQuran ? (
                  <button
                    type="button"
                    onClick={() => onOpenQuranDialog(habit)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      habit.isCompleted
                        ? 'bg-[#E6F6EE] text-[#1E8258] dark:bg-[#164E3D]/50 dark:text-[#A5DCCB]'
                        : 'bg-gray-100 dark:bg-[#182B25] text-gray-700 dark:text-gray-300 hover:bg-[#28876B] hover:text-white'
                    }`}
                  >
                    {habit.isCompleted ? 'مكتمل ✓' : 'تسجيل'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.habitKey, !habit.isCompleted)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      habit.isCompleted
                        ? 'bg-[#28876B] text-white shadow-xs'
                        : 'border-2 border-gray-300 dark:border-gray-600 hover:border-[#28876B]'
                    }`}
                  >
                    {habit.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Quick Tasbih & Azkar */}
      <div id="quick_counters_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>السبحة والأذكار السريعة</span>
          </h3>
          <button
            type="button"
            onClick={onNavigateToTasbih}
            className="text-xs text-[#28876B] dark:text-[#3DA384] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>فتح السبحة الإلكترونية</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {counters.slice(0, 4).map((c) => {
            const isCompleted = Boolean(c.isCompleted || c.count >= c.target);
            return (
              <div
                key={c.id}
                id={`counter_card_${c.counterKey}`}
                className="bg-white dark:bg-[#111E1A] rounded-2xl p-4 border border-gray-100 dark:border-[#223A33] shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {c.titleArabic}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      الهدف: {c.target} مرة
                    </p>
                  </div>
                  {isCompleted && (
                    <span className="text-[11px] font-semibold text-[#1E8258] dark:text-[#A5DCCB] bg-[#E6F6EE] dark:bg-[#164E3D]/40 px-2 py-0.5 rounded-lg border border-[#1E8258]/20">
                      ✓ تم تسجيل الإنجاز
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#1E332C]">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    العدد: <span className="font-mono font-bold text-gray-900 dark:text-white">{c.count}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Method 1: In-app counter */}
                    <button
                      type="button"
                      title="زيادة العداد داخل التطبيق"
                      onClick={() => {
                        playTasbihClick(soundEnabled);
                        onIncrementCounter(c.counterKey);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#182B25] dark:hover:bg-[#223A33] text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>العداد</span>
                    </button>

                    {/* Method 2: Done outside app or quick complete */}
                    {!isCompleted ? (
                      <button
                        type="button"
                        title="أنجزتها خارج التطبيق"
                        onClick={() => {
                          if (onCompleteCounter) {
                            onCompleteCounter(c.counterKey);
                          } else {
                            onIncrementCounter(c.counterKey);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E6F6EE] hover:bg-[#D1EFE2] text-[#1E8258] dark:bg-[#164E3D]/50 dark:hover:bg-[#164E3D]/80 dark:text-[#A5DCCB] text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all border border-[#1E8258]/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم الإنجاز</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="أنجزتها خارج التطبيق"
                        onClick={() => {
                          if (onCompleteCounter) {
                            onCompleteCounter(c.counterKey);
                          }
                        }}
                        className="px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        تأكيد الإنجاز ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Soul Accounting (محاسبة النفس) Card */}
      <div
        id="reflection_entry_card"
        className="bg-gradient-to-r from-[#F8FAF9] via-[#EDFAF5] to-[#F8FAF9] dark:from-[#111E1A] dark:via-[#162B24] dark:to-[#111E1A] p-5 rounded-3xl border border-[#28876B]/20 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#28876B]/15 text-[#1E6B54] dark:text-[#A5DCCB] flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-base text-gray-900 dark:text-white">
              محاسبة النفس ووقفة ختام اليوم 🤍
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {reflection?.isCompleted
                ? 'تم تسجيل محاسبة اليوم بنجاح. تقبل الله طاعتك وأعانك على الغد.'
                : 'لحظات هادئة لتسجيل ما صعب عليك اليوم والتهيؤ ليوم أفضل غدًا.'}
            </p>
          </div>
        </div>

        <button
          id="open_reflection_sheet_btn"
          type="button"
          onClick={onOpenReflection}
          className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#28876B] hover:bg-[#1E6B54] text-white shadow-sm transition-all cursor-pointer shrink-0"
        >
          {reflection?.isCompleted ? 'تعديل المحاسبة' : 'محاسبة اليوم'}
        </button>
      </div>
    </div>
  );
};
