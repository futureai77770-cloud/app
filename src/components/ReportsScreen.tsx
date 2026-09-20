import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Heart,
  AlertCircle,
  Moon,
  ChevronDown,
  Sparkles,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { WeekDetail, WeeklyReport } from '../types';
import { db } from '../data/db';
import { EgyptDateTimeService } from '../core/datetime/EgyptDateTimeService';

interface ReportsScreenProps {
  currentWeekKey: string;
  weeklyReports: WeeklyReport[];
  onOpenReviewYesterday?: () => void;
  onOpenReviewDay?: (dayKey: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  currentWeekKey,
  weeklyReports,
  onOpenReviewYesterday,
  onOpenReviewDay
}) => {
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(currentWeekKey);

  // Keep selected week synced if currentWeekKey changes
  useEffect(() => {
    if (!selectedWeekKey) {
      setSelectedWeekKey(currentWeekKey);
    }
  }, [currentWeekKey, selectedWeekKey]);

  // Load live week details from database
  const weekDetail: WeekDetail = useMemo(() => {
    return db.getWeekDetail(selectedWeekKey || currentWeekKey);
  }, [selectedWeekKey, currentWeekKey]);

  // Available weeks options: Current week + past weeks
  const availableWeeks = useMemo(() => {
    const list: Array<{ weekKey: string; label: string }> = [
      {
        weekKey: currentWeekKey,
        label: 'هذا الأسبوع (الأسبوع الحالي)'
      }
    ];

    weeklyReports.forEach((r) => {
      if (r.weekKey !== currentWeekKey) {
        list.push({
          weekKey: r.weekKey,
          label: `الأسبوع المنتهي (${r.startDate} إلى ${r.endDate})`
        });
      }
    });

    return list;
  }, [currentWeekKey, weeklyReports]);

  const handleReviewClick = (dayKey: string) => {
    if (onOpenReviewDay) {
      onOpenReviewDay(dayKey);
    } else if (onOpenReviewYesterday) {
      onOpenReviewYesterday();
    }
  };

  return (
    <div id="reports_screen" className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Header & Week Selector */}
      <div className="bg-white dark:bg-[#111E1A] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-[#223A33]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F6EE] dark:bg-[#164E3D]/40 text-[#1E8258] dark:text-[#A5DCCB] text-xs font-semibold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>لوحة التقرير الأسبوعي</span>
            </div>
            <h2 className="text-2xl font-bold font-amiri text-gray-900 dark:text-white">
              {weekDetail.isCurrentWeek ? 'تقرير هذا الأسبوع' : 'تقرير الأسبوع المنتهي'}
            </h2>
            <p className="text-sm font-semibold text-[#28876B] dark:text-[#3DA384] mt-1">
              {weekDetail.rangeFormattedArabic}
            </p>
          </div>

          {/* Week Dropdown */}
          <div className="relative min-w-[240px]">
            <select
              id="select_week_dropdown"
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              aria-label="اختر الأسبوع"
              className="w-full appearance-none px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#223A33] bg-gray-50 dark:bg-[#182B25] text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#28876B] cursor-pointer"
            >
              {availableWeeks.map((w) => (
                <option key={w.weekKey} value={w.weekKey}>
                  {w.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Calm philosophy note */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#1E332C] flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 text-[#28876B] shrink-0" />
          <span>
            هذه اللوحة وُجدت لمساعدتك على الاستمرار بهدوء وسكينة، دون حساب درجات أو مقارنات أو لوم.
          </span>
        </div>
      </div>

      {/* 2. Quick Summary Card (البطاقة التلخيصية السريعة) */}
      <div
        id="weekly_quick_summary_card"
        className="bg-white dark:bg-[#111E1A] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-[#223A33]"
      >
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#28876B]" />
          <span>نظرة سريعة على الأسبوع</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. الأيام المسجلة */}
          <div className="p-3.5 rounded-2xl bg-[#F0FDF4] dark:bg-[#132B22] border border-[#DCFCE7] dark:border-[#1E3A2F]">
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              الأيام المسجلة
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-[#1E8258] dark:text-[#A5DCCB]">
                {weekDetail.summary.recordedDaysCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">أيام</span>
            </div>
          </div>

          {/* 2. الأيام المحسومة */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              الأيام المحسومة
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-teal-700 dark:text-teal-300">
                {weekDetail.summary.finalizedDaysCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">أيام</span>
            </div>
          </div>

          {/* 3. أيام تحتاج مراجعة */}
          <div
            className={`p-3.5 rounded-2xl border ${
              weekDetail.summary.pendingReviewDaysCount > 0
                ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                : 'bg-gray-50 dark:bg-[#182B25] border-gray-100 dark:border-[#223A33]'
            }`}
          >
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              أيام تحتاج مراجعة
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold font-mono ${
                  weekDetail.summary.pendingReviewDaysCount > 0
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {weekDetail.summary.pendingReviewDaysCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">أيام</span>
            </div>
          </div>

          {/* 4. صلوات تم تسجيل حالتها */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              صلوات مسجلة الحالة
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
                {weekDetail.summary.recordedPrayersCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">صلاة</span>
            </div>
          </div>

          {/* 5. مهام وعبادات مسجلة */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              مهام وسنن منجزة
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {weekDetail.summary.recordedHabitsCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">مرة</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. أيام تحتاج مراجعة (قسم مستقل للأيام غير المحسومة من الأحدث للأقدم) */}
      {weekDetail.unfinalizedPastDays && weekDetail.unfinalizedPastDays.length > 0 && (
        <div
          id="unfinalized_past_days_section"
          className="bg-amber-50/80 dark:bg-amber-950/30 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/40 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                📅 أيام تحتاج مراجعة
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                الأيام السابقة التي لم تُحسم بعد. راجع ما تتذكره منها دون أي ضغط:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {weekDetail.unfinalizedPastDays.map((d) => (
              <div
                key={d.dayKey}
                id={`pending_day_card_${d.dayKey}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#111E1A] border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 shadow-xs"
              >
                <div>
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                    {d.dateFormattedArabic}
                  </h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    ما زالت بعض بيانات هذا اليوم تحتاج إلى تسجيل
                  </p>
                </div>
                <button
                  type="button"
                  id={`review_day_btn_${d.dayKey}`}
                  onClick={() => handleReviewClick(d.dayKey)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#28876B] hover:bg-[#1E6B54] text-white cursor-pointer transition-colors shadow-xs shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مراجعة اليوم</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. الصلوات الخمس هذا الأسبوع */}
      <div id="weekly_prayers_section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>الصلوات الخمس هذا الأسبوع</span>
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            بالترتيب الشرعي (الفجر إلى العشاء)
          </span>
        </div>

        {/* 4.1 بطاقات إحصائيات الصلوات الخمس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {weekDetail.prayerStats.map((p) => {
            return (
              <div
                key={p.prayer}
                id={`weekly_stat_${p.prayer.toLowerCase()}`}
                className="bg-white dark:bg-[#111E1A] rounded-2xl p-4 border border-gray-100 dark:border-[#223A33] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">
                      صلاة {p.titleArabic}
                    </h4>
                    <span className="text-xs font-bold text-[#1E8258] dark:text-[#A5DCCB] bg-[#E6F6EE] dark:bg-[#164E3D]/40 px-2 py-0.5 rounded-lg">
                      {p.recordedDays} مسجلة
                    </span>
                  </div>

                  {/* Breakdown of statuses */}
                  <div className="space-y-1.5 mt-3 pt-2 border-t border-gray-50 dark:border-[#1E332C] text-xs">
                    <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                      <span>جماعة 🕌:</span>
                      <span className="font-bold font-mono">{p.congregationDays} يوم</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                      <span>منفرد ✓:</span>
                      <span className="font-bold font-mono">{p.individualDays} يوم</span>
                    </div>

                    {p.missedDays > 0 && (
                      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                        <span>لم أصلِّ ✕:</span>
                        <span className="font-mono">{p.missedDays} يوم</span>
                      </div>
                    )}

                    {p.unrecordedDays > 0 && (
                      <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                        <span>غير مسجل ○:</span>
                        <span className="font-mono">{p.unrecordedDays} يوم</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4.2 جدول مصفوفة الصلوات اليومية للأسبوع */}
        {weekDetail.dailyPrayerMatrix && weekDetail.dailyPrayerMatrix.length > 0 && (
          <div className="bg-white dark:bg-[#111E1A] rounded-3xl p-5 shadow-xs border border-gray-100 dark:border-[#223A33] overflow-x-auto">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>سجل الصلوات اليومي في الأسبوع</span>
            </h4>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#223A33] text-gray-500 dark:text-gray-400">
                  <th className="py-2.5 px-3 font-bold">اليوم</th>
                  <th className="py-2.5 px-2 font-bold text-center">الفجر</th>
                  <th className="py-2.5 px-2 font-bold text-center">الظهر</th>
                  <th className="py-2.5 px-2 font-bold text-center">العصر</th>
                  <th className="py-2.5 px-2 font-bold text-center">المغرب</th>
                  <th className="py-2.5 px-2 font-bold text-center">العشاء</th>
                  <th className="py-2.5 px-2 font-bold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E332C]">
                {weekDetail.dailyPrayerMatrix.map((row) => (
                  <tr key={row.dayKey} className="hover:bg-gray-50/50 dark:hover:bg-[#182B25]/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {row.dayNameArabic}
                      </div>
                      <div className="text-[11px] text-gray-400">{row.dateFormatted}</div>
                    </td>
                    {row.prayers.map((pr) => {
                      let tagClass = 'bg-gray-100 dark:bg-gray-800 text-gray-500';
                      if (pr.status === 'CONGREGATION') {
                        tagClass = 'bg-[#E6F6EE] text-[#1E8258] dark:bg-[#164E3D]/50 dark:text-[#A5DCCB]';
                      } else if (pr.status === 'INDIVIDUAL') {
                        tagClass = 'bg-[#E6F3F6] text-[#327A8A] dark:bg-[#1b3d45]/50 dark:text-[#7fd4e4]';
                      } else if (pr.status === 'MISSED') {
                        tagClass = 'bg-[#FDECEB] text-[#B3534B] dark:bg-[#48201d]/50 dark:text-[#f3958e]';
                      }
                      return (
                        <td key={pr.prayer} className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${tagClass}`}
                          >
                            {pr.statusArabic}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-center">
                      {row.isPendingReview ? (
                        <button
                          type="button"
                          onClick={() => handleReviewClick(row.dayKey)}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 hover:bg-amber-200 cursor-pointer"
                        >
                          مراجعة
                        </button>
                      ) : row.isFinalized ? (
                        <span className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
                          محسوم ✓
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">اليوم</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. العبادات والسنن اليومية */}
      <div id="weekly_habits_section" className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          السنن والعبادات المسجلة هذا الأسبوع
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekDetail.habitStats.map((h) => {
            return (
              <div
                key={h.habitKey}
                id={`weekly_habit_${h.habitKey}`}
                className="bg-white dark:bg-[#111E1A] rounded-2xl p-4 border border-gray-100 dark:border-[#223A33] shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    {h.titleArabic}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    الأيام المنجزة هذا الأسبوع:
                  </p>
                </div>

                <div className="text-left">
                  <span className="text-lg font-bold font-mono text-[#1E8258] dark:text-[#A5DCCB]">
                    {h.recordedDays}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">أيام</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. الأذكار والعدادات */}
      <div id="weekly_counters_section" className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          الأذكار والتسبيحات المسجلة هذا الأسبوع
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weekDetail.counterStats.map((c) => {
            return (
              <div
                key={c.counterKey}
                id={`weekly_counter_${c.counterKey}`}
                className="bg-white dark:bg-[#111E1A] rounded-2xl p-4 border border-gray-100 dark:border-[#223A33] shadow-xs"
              >
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {c.titleArabic}
                </h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-[#28876B] dark:text-[#A5DCCB]">
                    {c.totalCount}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    في {c.recordedDays} أيام
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. أشياء لم تُسجل كثيرًا هذا الأسبوع (بهدوء وبدون لوم) */}
      {weekDetail.unrecordedNotices.length > 0 && (
        <div
          id="unrecorded_notices_section"
          className="bg-white dark:bg-[#111E1A] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-[#223A33]"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#182B25] text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                أشياء لم تُسجل كثيرًا هذا الأسبوع
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                عدم التسجيل لا يعني أبدًا عدم أداء العبادة، فربما أديتها وشُغلت عن تدوينها 🤍
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {weekDetail.unrecordedNotices.map((notice) => (
              <span
                key={notice.titleArabic}
                className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#182B25] text-xs font-semibold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#223A33] flex items-center gap-2"
              >
                <span>لم يتم تسجيل {notice.titleArabic} في</span>
                <span className="font-bold font-mono text-[#28876B] dark:text-[#3DA384]">
                  {notice.unrecordedDays} أيام
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 8. ملخص أسبوعك (Dynamic Calm Summary at bottom) */}
      {weekDetail.dynamicSummaryText && (
        <div
          id="weekly_calm_summary_box"
          className="bg-gradient-to-l from-[#F0FDF4] to-[#E6F6EE] dark:from-[#132B22] dark:to-[#164E3D]/30 p-6 rounded-3xl border border-[#DCFCE7] dark:border-[#1E3A2F]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111E1A] text-[#1E8258] dark:text-[#A5DCCB] flex items-center justify-center shadow-xs shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                ملخص أسبوعك
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                {weekDetail.dynamicSummaryText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
