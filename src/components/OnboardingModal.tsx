import React, { useState } from 'react';
import { EGYPTIAN_CITIES, DEFAULT_CITY } from '../core/prayer/EgyptPrayerTimesEngine';
import { MapPin, Sparkles, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (cityName: string, lat: number, lng: number) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [selectedCityId, setSelectedCityId] = useState<string>(DEFAULT_CITY.id);

  if (!isOpen) return null;

  const handleStart = () => {
    const city = EGYPTIAN_CITIES.find((c) => c.id === selectedCityId) || DEFAULT_CITY;
    onComplete(city.nameArabic, city.latitude, city.longitude);
  };

  return (
    <div
      id="onboarding_modal_overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div
        id="onboarding_card"
        className="w-full max-w-md bg-white dark:bg-[#111E1A] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-[#223A33] text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-[#D4EFE6] dark:bg-[#164E3D]/50 text-[#164E3D] dark:text-[#A5DCCB] mx-auto flex items-center justify-center text-3xl mb-4 shadow-sm">
          🕌
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 font-amiri">
          أهلاً بك في «أهل القرآن» 🤍
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          رفيقك اليومي الهادئ لمساعدتك على المحافظة على صلواتك في جماعة، ووردك من كتاب الله، ونوافل يومك، بأسبوعية مباركة تبدأ وتنتهي فجر الجمعة وفق التوقيت المحلي لجمهورية مصر العربية.
        </p>

        <div className="bg-gray-50 dark:bg-[#182B25] p-4 rounded-2xl border border-gray-200/70 dark:border-[#223A33] text-right mb-6">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#28876B]" />
            اختر محافظتك لحساب مواقيت الصلاة بدقة:
          </label>
          <select
            id="onboarding_city_select"
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#223A33] bg-white dark:bg-[#0A120F] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#28876B] cursor-pointer"
          >
            {EGYPTIAN_CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.nameArabic}
              </option>
            ))}
          </select>
        </div>

        <button
          id="onboarding_submit_btn"
          type="button"
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-[#28876B] hover:bg-[#1E6B54] text-white font-bold text-base shadow-lg shadow-[#28876B]/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Sparkles className="w-5 h-5 text-[#E8C97E]" />
          ابدأ رحلتك المباركة
        </button>
      </div>
    </div>
  );
};
