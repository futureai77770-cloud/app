import React, { useState } from 'react';
import { X, Heart, Check } from 'lucide-react';
import { HabitRecord, PrayerRecord } from '../types';
import { PrayerReasons } from '../data/defaultData';

interface DailyReflectionSheetProps {
  isOpen: boolean;
  prayers: PrayerRecord[];
  habits: HabitRecord[];
  currentStruggledHabit?: string | null;
  currentReason?: string | null;
  currentCustomReason?: string | null;
  currentNote?: string | null;
  onClose: () => void;
  onSave: (
    struggledHabit: string | null,
    reason: string | null,
    customReason: string | null,
    note: string | null
  ) => void;
}

export const DailyReflectionSheet: React.FC<DailyReflectionSheetProps> = ({
  isOpen,
  prayers,
  habits,
  currentStruggledHabit,
  currentReason,
  currentCustomReason,
  currentNote,
  onClose,
  onSave
}) => {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(currentStruggledHabit || null);
  const [selectedReason, setSelectedReason] = useState<string | null>(currentReason || null);
  const [customReasonText, setCustomReasonText] = useState<string>(currentCustomReason || '');
  const [noteText, setNoteText] = useState<string>(currentNote || '');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(currentReason === 'سبب آخر');

  if (!isOpen) return null;

  const congregationCount = prayers.filter((p) => p.status === 'CONGREGATION').length;
  const individualCount = prayers.filter((p) => p.status === 'INDIVIDUAL').length;
  const completedHabitsCount = habits.filter((h) => h.isCompleted).length;

  const habitOptions = [
    'صلاة الفجر في وقتها',
    'صلاة الجماعة بالمسجد',
    'ورد القرآن',
    'الأذكار والاستغفار',
    'صلاة الوتر',
    'صلاة الضحى'
  ];

  const handleReasonClick = (reason: string) => {
    if (selectedReason === reason) {
      setSelectedReason(null);
      setShowCustomInput(false);
    } else {
      setSelectedReason(reason);
      setShowCustomInput(reason === 'سبب آخر');
    }
  };

  const handleSave = () => {
    onSave(
      selectedHabit,
      selectedReason,
      showCustomInput ? customReasonText : null,
      noteText.trim() ? noteText.trim() : null
    );
    onClose();
  };

  return (
    <div
      id="reflection_sheet_overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="reflection_sheet_content"
        className="w-full max-w-lg bg-white dark:bg-[#111E1A] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-[#223A33] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#223A33] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#D4EFE6] dark:bg-[#164E3D]/40 text-[#164E3D] dark:text-[#A5DCCB] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                محاسبة النفس 🤍
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                وقفة سريعة لختام يومك واستعداد أفضل للغد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#182B25] text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day harvest pill */}
        <div className="bg-[#EFF4F2] dark:bg-[#182B25] p-4 rounded-2xl border border-gray-200/60 dark:border-[#223A33] mb-5">
          <div className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-2">
            حصاد يومك اليوم:
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="text-[#1E8258] dark:text-[#3DA384]">
              🕌 {congregationCount} جماعة | ✓ {individualCount} منفرد
            </span>
            <span className="text-[#28876B] dark:text-[#A5DCCB]">
              🌿 {completedHabitsCount} عبادات منجزة
            </span>
          </div>
        </div>

        {/* Struggle question */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              ما أكثر عبادة واجهت فيها صعوبة اليوم؟ (اختياري)
            </label>
            <div className="flex flex-wrap gap-2">
              {habitOptions.map((h) => {
                const isSelected = selectedHabit === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHabit(isSelected ? null : h)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#28876B] text-white border-[#28876B]'
                        : 'bg-gray-100 dark:bg-[#182B25] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#223A33] hover:bg-gray-200'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Struggle reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              ما السبب الرئيسي؟
            </label>
            <div className="flex flex-wrap gap-2">
              {PrayerReasons.REFLECTION_STRUGGLE_REASONS.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleReasonClick(r)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#28876B] text-white border-[#28876B]'
                        : 'bg-gray-100 dark:bg-[#182B25] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#223A33] hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {showCustomInput && (
              <input
                id="custom_struggle_reason_input"
                type="text"
                placeholder="اكتب السبب بإيجاز..."
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#223A33] bg-white dark:bg-[#0A120F] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#28876B]"
              />
            )}
          </div>

          {/* Note for tomorrow */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              خاطرة أو عزيمة ليوم الغد (اختياري)
            </label>
            <textarea
              id="reflection_note_input"
              rows={2}
              placeholder="مثال: النوم مبكرًا للاستيقاظ بنشاط لصلاة الفجر بإذن الله..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#223A33] bg-white dark:bg-[#0A120F] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#28876B]"
            />
          </div>

          <button
            id="save_reflection_btn"
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-[#28876B] hover:bg-[#1E6B54] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Check className="w-4 h-4" />
            حفظ المحاسبة وتجهيز الغد
          </button>
        </div>
      </div>
    </div>
  );
};
