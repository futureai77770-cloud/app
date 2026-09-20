import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, Check, ChevronDown, CheckCircle2 } from 'lucide-react';
import { CounterRecord } from '../types';
import { ALL_COUNTERS } from '../data/defaultData';
import { playTasbihClick } from '../utils/audio';

interface TasbihScreenProps {
  counters: CounterRecord[];
  soundEnabled: boolean;
  onIncrementCounter: (counterKey: string) => void;
  onCompleteCounter?: (counterKey: string) => void;
  onResetCounter: (counterKey: string) => void;
  onToggleSound: () => void;
}

export const TasbihScreen: React.FC<TasbihScreenProps> = ({
  counters,
  soundEnabled,
  onIncrementCounter,
  onCompleteCounter,
  onResetCounter,
  onToggleSound
}) => {
  const [selectedKey, setSelectedKey] = useState<string>('counter_istighfar');
  const [targetLimit, setTargetLimit] = useState<number>(100);

  const activeDef = ALL_COUNTERS.find((c) => c.key === selectedKey) || ALL_COUNTERS[0];
  const activeRecord = counters.find((c) => c.counterKey === selectedKey);
  const currentCount = activeRecord?.count || 0;
  const isCurrentCompleted = Boolean(activeRecord?.isCompleted || currentCount >= targetLimit);

  const totalAllCounters = counters.reduce((sum, c) => sum + (c.count || 0), 0);

  const handleTap = () => {
    playTasbihClick(soundEnabled);
    onIncrementCounter(selectedKey);
  };

  const handleCompleteOutside = () => {
    if (onCompleteCounter) {
      onCompleteCounter(selectedKey);
    } else {
      onIncrementCounter(selectedKey);
    }
  };

  const handleReset = () => {
    onResetCounter(selectedKey);
  };

  const progressPercent = targetLimit > 0 ? Math.min(100, Math.round((currentCount / targetLimit) * 100)) : 0;

  return (
    <div id="tasbih_screen" className="max-w-xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111E1A] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-[#223A33] text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">إجمالي تسبيحات اليوم</span>
            <div className="text-xl font-bold font-mono text-[#28876B] dark:text-[#A5DCCB]">
              {totalAllCounters} ذكرًا
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#E6F6EE] border-[#1E8258] text-[#1E8258] dark:bg-[#164E3D]/40'
                : 'bg-gray-100 dark:bg-[#182B25] border-gray-200 dark:border-[#223A33] text-gray-400'
            }`}
            title={soundEnabled ? 'صوت التسبيح مفعّل' : 'صوت التسبيح مكتوم'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Dhikr Selector */}
        <div className="relative mb-4">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 text-right mb-1.5">
            اختر الذكر المبارك:
          </label>
          <div className="relative">
            <select
              id="tasbih_dhikr_select"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-2xl border border-gray-200 dark:border-[#223A33] bg-gray-50 dark:bg-[#182B25] text-gray-900 dark:text-white font-bold text-sm focus:outline-none focus:border-[#28876B] cursor-pointer"
            >
              {ALL_COUNTERS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.titleArabic} — {c.transliterationArabic}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Virtue & Transliteration */}
        <div className="bg-[#F8FAF9] dark:bg-[#142621] p-4 rounded-2xl border border-gray-200/60 dark:border-[#223A33] mb-3">
          <h3 className="text-xl sm:text-2xl font-bold font-amiri text-gray-900 dark:text-white mb-1">
            {activeDef.transliterationArabic}
          </h3>
          <p className="text-xs text-[#28876B] dark:text-[#E8C97E] font-medium">
            {activeDef.virtueArabic}
          </p>
        </div>

        {/* Target limit switcher */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">الهدف:</span>
          {[33, 100, 500, 1000].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTargetLimit(t)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                targetLimit === t
                  ? 'bg-[#28876B] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-[#182B25] text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Large Interactive Tactile Misbaha Button */}
      <div className="bg-white dark:bg-[#111E1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-[#223A33] text-center flex flex-col items-center justify-center">
        <div className="relative mb-6">
          {/* Circular SVG Progress Ring */}
          <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="44%"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-gray-100 dark:text-[#182B25]"
            />
            <circle
              cx="50%"
              cy="50%"
              r="44%"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="text-[#28876B] dark:text-[#3DA384] transition-all duration-300"
            />
          </svg>

          {/* Central Tap Disc */}
          <button
            id="tasbih_tap_button"
            type="button"
            onClick={handleTap}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-[#0F382C] via-[#164E3D] to-[#1E6B54] text-white shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform duration-100 cursor-pointer select-none border-4 border-white/20"
          >
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mb-1">
              {currentCount}
            </span>
            <span className="text-xs sm:text-sm text-[#E8C97E] font-medium tracking-wide">
              من {targetLimit}
            </span>
            <span className="text-[10px] text-white/60 mt-3 uppercase tracking-widest">
              اضغط للتسبيح بالعداد
            </span>
          </button>
        </div>

        {/* Peaceful Status & Dual Methods */}
        <div className="w-full max-w-sm space-y-3">
          {isCurrentCompleted ? (
            <div className="p-3 rounded-2xl bg-[#E6F6EE] dark:bg-[#164E3D]/40 border border-[#1E8258]/20 text-[#1E8258] dark:text-[#A5DCCB] text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم تسجيل الإنجاز لهذا اليوم والحمد لله</span>
            </div>
          ) : (
            <button
              type="button"
              id="tasbih_complete_outside_btn"
              onClick={handleCompleteOutside}
              className="w-full py-3 px-4 rounded-2xl bg-[#E6F6EE] hover:bg-[#D1EFE2] text-[#1E8258] dark:bg-[#164E3D]/50 dark:hover:bg-[#164E3D]/80 dark:text-[#A5DCCB] text-sm font-bold flex items-center justify-center gap-2 border border-[#1E8258]/30 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>أنجزتها خارج التطبيق (✓ تم الإنجاز)</span>
            </button>
          )}

          {/* Reset button */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              id="tasbih_reset_button"
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-[#182B25] text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              تصفير العداد
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Other Counters with direct completion buttons */}
      <div className="bg-white dark:bg-[#111E1A] rounded-3xl p-6 shadow-xs border border-gray-100 dark:border-[#223A33]">
        <h4 className="font-bold text-base text-gray-900 dark:text-white mb-3 text-right">
          سجل الأذكار اليومية:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_COUNTERS.map((c) => {
            const rec = counters.find((r) => r.counterKey === c.key);
            const cnt = rec?.count || 0;
            const isDone = Boolean(rec?.isCompleted || cnt >= c.defaultTarget);
            const isSelected = selectedKey === c.key;

            return (
              <div
                key={c.key}
                className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-[#28876B] bg-[#E6F6EE]/40 dark:bg-[#164E3D]/30'
                    : 'border-gray-100 dark:border-[#223A33] bg-gray-50/50 dark:bg-[#182B25]/50'
                }`}
              >
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => setSelectedKey(c.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                      {c.titleArabic}
                    </h5>
                    {isDone && (
                      <span className="text-[10px] text-[#1E8258] dark:text-[#A5DCCB] font-bold">
                        ✓ منجز
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    العدد: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{cnt}</span> / {c.defaultTarget}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="اختيار للتسبيح"
                    onClick={() => setSelectedKey(c.key)}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#182B25] hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    عداد
                  </button>

                  {!isDone ? (
                    <button
                      type="button"
                      title="تم الإنجاز خارج التطبيق"
                      onClick={() => {
                        if (onCompleteCounter) {
                          onCompleteCounter(c.key);
                        } else {
                          onIncrementCounter(c.key);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#E6F6EE] dark:bg-[#164E3D]/50 text-[#1E8258] dark:text-[#A5DCCB] text-xs font-bold border border-[#1E8258]/30 cursor-pointer"
                    >
                      ✓ تم
                    </button>
                  ) : (
                    <span className="text-xs text-[#1E8258] px-2 font-bold">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
