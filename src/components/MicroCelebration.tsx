import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface MicroCelebrationProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  triggerConfetti?: boolean;
}

export const MicroCelebration: React.FC<MicroCelebrationProps> = ({
  visible,
  title = 'ما شاء الله 🤍',
  subtitle = 'أحسنت، خطوة مباركة في طاعة الله',
  triggerConfetti = true
}) => {
  useEffect(() => {
    if (visible && triggerConfetti) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#28876B', '#C9A24D', '#A5DCCB', '#E8C97E']
        });
      } catch {
        // Safe fallback
      }
    }
  }, [visible, triggerConfetti]);

  if (!visible) return null;

  return (
    <div
      id="micro_celebration_banner"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-bounce duration-300"
    >
      <div className="bg-[#0F382C] text-white border border-[#28876B]/40 shadow-2xl rounded-2xl px-5 py-3.5 flex items-center justify-between">
        <span className="text-2xl select-none">✨</span>
        <div className="text-center px-2 flex-1">
          <h4 className="font-bold text-sm sm:text-base text-white">{title}</h4>
          <p className="text-xs text-[#E8C97E] mt-0.5">{subtitle}</p>
        </div>
        <span className="text-2xl select-none">✨</span>
      </div>
    </div>
  );
};
