import React, { useState } from 'react';
import { BookOpen, X, Check } from 'lucide-react';

interface QuranWirdDialogProps {
  isOpen: boolean;
  initialCompleted: boolean;
  initialNotes?: string | null;
  onClose: () => void;
  onSave: (completed: boolean, notes: string | null) => void;
}

export const QuranWirdDialog: React.FC<QuranWirdDialogProps> = ({
  isOpen,
  initialCompleted,
  initialNotes,
  onClose,
  onSave
}) => {
  const [completed, setCompleted] = useState<boolean>(initialCompleted);
  const [notes, setNotes] = useState<string>(initialNotes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(completed, notes.trim() ? notes.trim() : null);
    onClose();
  };

  return (
    <div
      id="quran_wird_dialog_overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quran_wird_dialog_card"
        className="w-full max-w-md bg-white dark:bg-[#111E1A] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-[#223A33]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#223A33] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F6EE] dark:bg-[#164E3D]/40 text-[#1E8258] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ورد القرآن الكريم
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                سجل إنجازك أو الصفحة للمتابعة
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

        <div className="space-y-4">
          {/* Completed Toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#182B25] border border-gray-200 dark:border-[#223A33] cursor-pointer">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              تم إكمال الورد اليومي
            </span>
            <input
              id="quran_wird_checkbox"
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-5 h-5 rounded-md accent-[#28876B] text-[#28876B] cursor-pointer"
            />
          </label>

          {/* Notes input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              الصفحة أو الجزء (اختياري)
            </label>
            <input
              id="quran_wird_notes_input"
              type="text"
              placeholder="مثال: سورة الكهف، أو صفحة 25 إلى 30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#223A33] bg-white dark:bg-[#0A120F] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#28876B]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#223A33] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#182B25] text-sm font-medium cursor-pointer"
            >
              إلغاء
            </button>
            <button
              id="save_quran_wird_btn"
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-[#28876B] hover:bg-[#1E6B54] text-white text-sm font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
