import React, { useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { PrayerStatus } from '../types';
import { PrayerReasons } from '../data/defaultData';

interface PrayerBottomSheetProps {
  isOpen: boolean;
  prayerNameArabic: string;
  prayerTime: string;
  currentStatus: PrayerStatus;
  currentReason?: string | null;
  currentCustomReason?: string | null;
  onClose: () => void;
  onSave: (status: PrayerStatus, reason: string | null, customReason: string | null) => void;
}

export const PrayerBottomSheet: React.FC<PrayerBottomSheetProps> = ({
  isOpen,
  prayerNameArabic,
  prayerTime,
  currentStatus,
  currentReason,
  currentCustomReason,
  onClose,
  onSave
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PrayerStatus>(currentStatus);
  const [selectedReason, setSelectedReason] = useState<string | null>(currentReason || null);
  const [customReasonText, setCustomReasonText] = useState<string>(currentCustomReason || '');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(currentReason === 'سبب آخر');

  if (!isOpen) return null;

  const handleStatusSelect = (status: PrayerStatus) => {
    setSelectedStatus(status);
    if (status === 'CONGREGATION') {
      setSelectedReason(null);
      setShowCustomInput(false);
      onSave('CONGREGATION', null, null);
      onClose();
    }
  };

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
    onSave(selectedStatus, selectedReason, showCustomInput ? customReasonText : null);
    onClose();
  };

  const handleResetToUnrecorded = () => {
    setSelectedStatus('UNRECORDED');
    setSelectedReason(null);
    setShowCustomInput(false);
    onSave('UNRECORDED', null, null);
    onClose();
  };

  const reasonsList = selectedStatus === 'INDIVIDUAL'
    ? PrayerReasons.INDIVIDUAL_REASONS
    : PrayerReasons.MISSED_REASONS;

  const reasonTitle = selectedStatus === 'INDIVIDUAL'
    ? 'لماذا لم تصلِّ جماعة؟ (اختياري)'
    : 'ما السبب؟ (اختياري للتحسين المستقبلي)';

  return (
    <div
      id="prayer_bottom_sheet_overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="prayer_bottom_sheet_content"
        className="w-full max-w-lg bg-white dark:bg-[#111E1A] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-[#223A33] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#223A33] pb-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              كيف صليت صلاة {prayerNameArabic}؟
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              موعد الأذان: {prayerTime}
            </p>
          </div>
          <button
            id="prayer_sheet_close_btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#182B25] text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Choice Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* 1. Congregation */}
          <button
            id="prayer_choice_congregation"
            type="button"
            onClick={() => handleStatusSelect('CONGREGATION')}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              selectedStatus === 'CONGREGATION'
                ? 'bg-[#E6F6EE] border-[#1E8258] text-[#1E8258] ring-2 ring-[#1E8258]/30 dark:bg-[#164E3D]/40 dark:border-[#3DA384]'
                : 'bg-gray-50 dark:bg-[#182B25] border-gray-200 dark:border-[#223A33] text-gray-700 dark:text-gray-300 hover:border-[#1E8258]'
            }`}
          >
            <span className="text-2xl mb-1">🕌</span>
            <span className="font-bold text-sm block">جماعة</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">في المسجد</span>
          </button>

          {/* 2. Individual */}
          <button
            id="prayer_choice_individual"
            type="button"
            onClick={() => handleStatusSelect('INDIVIDUAL')}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              selectedStatus === 'INDIVIDUAL'
                ? 'bg-[#E6F3F6] border-[#327A8A] text-[#327A8A] ring-2 ring-[#327A8A]/30 dark:bg-[#1b3d45]/40 dark:border-[#4fa7b8]'
                : 'bg-gray-50 dark:bg-[#182B25] border-gray-200 dark:border-[#223A33] text-gray-700 dark:text-gray-300 hover:border-[#327A8A]'
            }`}
          >
            <span className="text-2xl mb-1">✓</span>
            <span className="font-bold text-sm block">منفردًا</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">في البيت أو العمل</span>
          </button>

          {/* 3. Missed */}
          <button
            id="prayer_choice_missed"
            type="button"
            onClick={() => handleStatusSelect('MISSED')}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              selectedStatus === 'MISSED'
                ? 'bg-[#FDECEB] border-[#B3534B] text-[#B3534B] ring-2 ring-[#B3534B]/30 dark:bg-[#48201d]/40 dark:border-[#db776f]'
                : 'bg-gray-50 dark:bg-[#182B25] border-gray-200 dark:border-[#223A33] text-gray-700 dark:text-gray-300 hover:border-[#B3534B]'
            }`}
          >
            <span className="text-2xl mb-1">✕</span>
            <span className="font-bold text-sm block">لم أصلِّ</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">فاتني الوقت</span>
          </button>
        </div>

        {/* Reasons section if Individual or Missed */}
        {(selectedStatus === 'INDIVIDUAL' || selectedStatus === 'MISSED') && (
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-[#223A33] animate-in fade-in duration-150">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              {reasonTitle}
            </label>

            <div className="flex flex-wrap gap-2">
              {reasonsList.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleReasonClick(reason)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#28876B] text-white border-[#28876B]'
                        : 'bg-gray-100 dark:bg-[#182B25] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#223A33] hover:bg-gray-200'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>

            {showCustomInput && (
              <input
                id="custom_reason_input"
                type="text"
                placeholder="اكتب السبب بإيجاز..."
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#223A33] bg-white dark:bg-[#0A120F] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#28876B]"
              />
            )}

            <button
              id="save_prayer_update_btn"
              type="button"
              onClick={handleSave}
              className="w-full mt-3 py-3 rounded-xl bg-[#28876B] hover:bg-[#1E6B54] text-white font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              حفظ التحديث
            </button>
          </div>
        )}

        {/* Undo Recording / Return to UNRECORDED */}
        {currentStatus !== 'UNRECORDED' && (
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-[#223A33]">
            <button
              id="prayer_sheet_undo_btn"
              type="button"
              onClick={handleResetToUnrecorded}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-[#223A33] bg-gray-50 dark:bg-[#182B25] hover:bg-gray-100 dark:hover:bg-[#1f3730] text-gray-600 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>إلغاء التسجيل (العودة إلى غير مسجل)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
