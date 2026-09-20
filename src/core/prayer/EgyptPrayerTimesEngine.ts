import { DailyPrayerTimes, EgyptianCity, NextPrayerInfo, PrayerType } from '../../types';
import { EgyptDateTimeService } from '../datetime/EgyptDateTimeService';

/**
 * All 27 Egyptian Governorates with coordinates.
 */
export const EGYPTIAN_CITIES: EgyptianCity[] = [
  { id: 'cairo', nameArabic: 'القاهرة', nameEnglish: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
  { id: 'alexandria', nameArabic: 'الإسكندرية', nameEnglish: 'Alexandria', latitude: 31.2001, longitude: 29.9187 },
  { id: 'giza', nameArabic: 'الجيزة', nameEnglish: 'Giza', latitude: 30.0131, longitude: 31.2089 },
  { id: 'port_said', nameArabic: 'بورسعيد', nameEnglish: 'Port Said', latitude: 31.2653, longitude: 32.3019 },
  { id: 'suez', nameArabic: 'السويس', nameEnglish: 'Suez', latitude: 29.9668, longitude: 32.5498 },
  { id: 'luxor', nameArabic: 'الأقصر', nameEnglish: 'Luxor', latitude: 25.6872, longitude: 32.6396 },
  { id: 'aswan', nameArabic: 'أسوان', nameEnglish: 'Aswan', latitude: 24.0889, longitude: 32.8998 },
  { id: 'tanta', nameArabic: 'طنطا (الغربية)', nameEnglish: 'Tanta', latitude: 30.7865, longitude: 31.0004 },
  { id: 'mansoura', nameArabic: 'المنصورة (الدقهلية)', nameEnglish: 'Mansoura', latitude: 31.0409, longitude: 31.3785 },
  { id: 'zagazig', nameArabic: 'الزقازيق (الشرقية)', nameEnglish: 'Zagazig', latitude: 30.5877, longitude: 31.5020 },
  { id: 'ismailia', nameArabic: 'الإسماعيلية', nameEnglish: 'Ismailia', latitude: 30.5965, longitude: 32.2715 },
  { id: 'fayoum', nameArabic: 'الفيوم', nameEnglish: 'Fayoum', latitude: 29.3084, longitude: 30.8428 },
  { id: 'beni_suef', nameArabic: 'بني سويف', nameEnglish: 'Beni Suef', latitude: 29.0661, longitude: 31.0994 },
  { id: 'minya', nameArabic: 'المنيا', nameEnglish: 'Minya', latitude: 28.0871, longitude: 30.7618 },
  { id: 'asyut', nameArabic: 'أسيوط', nameEnglish: 'Asyut', latitude: 27.1783, longitude: 31.1859 },
  { id: 'sohag', nameArabic: 'سوهاج', nameEnglish: 'Sohag', latitude: 26.5569, longitude: 31.6948 },
  { id: 'qena', nameArabic: 'قنا', nameEnglish: 'Qena', latitude: 26.1551, longitude: 32.7160 },
  { id: 'damanhur', nameArabic: 'دمنهور (البحيرة)', nameEnglish: 'Damanhur', latitude: 31.0425, longitude: 30.4703 },
  { id: 'damietta', nameArabic: 'دمياط', nameEnglish: 'Damietta', latitude: 31.4175, longitude: 31.8144 },
  { id: 'kafr_el_sheikh', nameArabic: 'كفر الشيخ', nameEnglish: 'Kafr El Sheikh', latitude: 31.1107, longitude: 30.9388 },
  { id: 'shibin_el_kom', nameArabic: 'شبين الكوم (المنوفية)', nameEnglish: 'Shibin El Kom', latitude: 30.5526, longitude: 31.0090 },
  { id: 'banha', nameArabic: 'بنها (القليوبية)', nameEnglish: 'Banha', latitude: 30.4660, longitude: 31.1853 },
  { id: 'hurghada', nameArabic: 'الغردقة (البحر الأحمر)', nameEnglish: 'Hurghada', latitude: 27.2579, longitude: 33.8116 },
  { id: 'sharm_el_sheikh', nameArabic: 'شرم الشيخ (جنوب سيناء)', nameEnglish: 'Sharm El Sheikh', latitude: 27.9158, longitude: 34.3299 },
  { id: 'arish', nameArabic: 'العريش (شمال سيناء)', nameEnglish: 'Arish', latitude: 31.1325, longitude: 33.8033 },
  { id: 'marsa_matruh', nameArabic: 'مرسى مطروح', nameEnglish: 'Marsa Matruh', latitude: 31.3543, longitude: 27.2373 },
  { id: 'kharga', nameArabic: 'الخارجة (الوادي الجديد)', nameEnglish: 'Kharga', latitude: 25.4514, longitude: 30.5464 }
];

export const DEFAULT_CITY = EGYPTIAN_CITIES[0]; // Cairo

/**
 * Egyptian General Authority of Survey (الهيئة المصرية العامة للمساحة) Prayer Times Engine.
 * Fajr: 19.5 degrees
 * Isha: 17.5 degrees
 * Asr: Standard (Shafi'i, shadow ratio 1.0)
 */
export class EgyptPrayerTimesEngine {
  private static FAJR_ANGLE = 19.5;
  private static ISHA_ANGLE = 17.5;

  private static toRadians(deg: number): number {
    return (deg * Math.PI) / 180.0;
  }

  private static toDegrees(rad: number): number {
    return (rad * 180.0) / Math.PI;
  }

  private static fixHour(h: number): number {
    let res = h % 24;
    if (res < 0) res += 24;
    return res;
  }

  /**
   * Returns Egypt's exact UTC offset in hours for the given date (e.g., +2 in winter, +3 in DST).
   */
  public static getEgyptUtcOffsetHours(year: number, month: number, day: number): number {
    try {
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const cairoStr = utcDate.toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        timeZoneName: 'shortOffset'
      });
      const match = cairoStr.match(/GMT([+-]\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    } catch {
      // Fallback
    }
    return 2.0; // Standard Egyptian winter time
  }

  /**
   * Astronomical calculation for solar position.
   */
  private static calculateSolarParameters(julianDay: number) {
    const d = julianDay - 2451545.0;
    const g = this.fixHour(357.529 + 0.98560028 * d);
    const q = this.fixHour(280.459 + 0.98564736 * d);
    const l = this.fixHour(q + 1.915 * Math.sin(this.toRadians(g)) + 0.02 * Math.sin(this.toRadians(2 * g)));
    const e = 23.439 - 0.00000036 * d;

    // Declination
    const sinD = Math.sin(this.toRadians(e)) * Math.sin(this.toRadians(l));
    const declination = this.toDegrees(Math.asin(sinD));

    // Right ascension
    let ra = this.toDegrees(Math.atan2(
      Math.cos(this.toRadians(e)) * Math.sin(this.toRadians(l)),
      Math.cos(this.toRadians(l))
    )) / 15.0;
    ra = this.fixHour(ra);

    // Equation of Time (in hours)
    const equationOfTime = q / 15.0 - ra;

    return { declination, equationOfTime };
  }

  private static julianDate(year: number, month: number, day: number): number {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  }

  /**
   * Calculates daily prayer times for an Egyptian location.
   */
  static calculatePrayerTimes(
    dayKey: string,
    latitude: number = DEFAULT_CITY.latitude,
    longitude: number = DEFAULT_CITY.longitude,
    cityName: string = DEFAULT_CITY.nameArabic
  ): DailyPrayerTimes {
    const parts = dayKey.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const timezoneOffset = this.getEgyptUtcOffsetHours(year, month, day);
    const jd = this.julianDate(year, month, day);
    const { declination, equationOfTime } = this.calculateSolarParameters(jd);

    const latRad = this.toRadians(latitude);
    const decRad = this.toRadians(declination);

    // Dhuhr: Solar noon
    const solarNoon = 12.0 + timezoneOffset - (longitude / 15.0) - equationOfTime;

    // Helper for sun depression angle
    const sunAngleTime = (angle: number): number => {
      const cosH = (-Math.sin(this.toRadians(angle)) - Math.sin(latRad) * Math.sin(decRad)) /
                   (Math.cos(latRad) * Math.cos(decRad));
      if (cosH > 1.0 || cosH < -1.0) return 0;
      return this.toDegrees(Math.acos(cosH)) / 15.0;
    };

    // Fajr (19.5 deg)
    const fajrDiff = sunAngleTime(this.FAJR_ANGLE);
    const fajrTime = solarNoon - fajrDiff;

    // Sunrise (0.833 deg refraction + semi-diameter)
    const sunriseDiff = sunAngleTime(0.833);
    const sunriseTime = solarNoon - sunriseDiff;

    // Asr: shadow factor = 1.0 (Shafi'i/Egyptian Survey Authority)
    const asrAngle = this.toDegrees(Math.atan(1.0 + Math.tan(Math.abs(latRad - decRad))));
    const asrDiff = sunAngleTime(-asrAngle);
    const asrTime = solarNoon + asrDiff;

    // Sunset / Maghrib (0.833 deg)
    const sunsetDiff = sunAngleTime(0.833);
    const sunsetTime = solarNoon + sunsetDiff;

    // Isha (17.5 deg)
    const ishaDiff = sunAngleTime(this.ISHA_ANGLE);
    const ishaTime = solarNoon + ishaDiff;

    const formatHourMinute = (decimalHour: number): { timeStr: string; date: Date } => {
      const fixed = this.fixHour(decimalHour);
      const hours = Math.floor(fixed);
      const minutes = Math.round((fixed - hours) * 60);

      let adjustedHours = hours;
      let adjustedMinutes = minutes;
      if (adjustedMinutes >= 60) {
        adjustedHours = (adjustedHours + 1) % 24;
        adjustedMinutes = 0;
      }

      const str = `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
      const d = new Date(year, month - 1, day, adjustedHours, adjustedMinutes, 0);
      return { timeStr: str, date: d };
    };

    const fajr = formatHourMinute(fajrTime);
    const sunrise = formatHourMinute(sunriseTime);
    const dhuhr = formatHourMinute(solarNoon);
    const asr = formatHourMinute(asrTime);
    const maghrib = formatHourMinute(sunsetTime);
    const isha = formatHourMinute(ishaTime);

    // Next day Fajr for night calculations
    const nextJd = jd + 1;
    const nextSolar = this.calculateSolarParameters(nextJd);
    const nextFajrDiff = (-Math.sin(this.toRadians(this.FAJR_ANGLE)) - Math.sin(latRad) * Math.sin(this.toRadians(nextSolar.declination))) /
                         (Math.cos(latRad) * Math.cos(this.toRadians(nextSolar.declination)));
    const nextFajrVal = 12.0 + timezoneOffset - (longitude / 15.0) - nextSolar.equationOfTime - (this.toDegrees(Math.acos(nextFajrDiff)) / 15.0);
    const nextFajr = formatHourMinute(nextFajrVal);
    const nextFajrDate = new Date(year, month - 1, day + 1, nextFajr.date.getHours(), nextFajr.date.getMinutes(), 0);

    // Night calculations: from Sunset to next Fajr
    const sunsetTimestamp = maghrib.date.getTime();
    const nextFajrTimestamp = nextFajrDate.getTime();
    const nightDurationMs = Math.max(0, nextFajrTimestamp - sunsetTimestamp);

    // Midnight = sunset + 1/2 of night
    const midnightTimestamp = sunsetTimestamp + nightDurationMs / 2;
    const midnightDate = new Date(midnightTimestamp);
    const midnight = `${String(midnightDate.getHours()).padStart(2, '0')}:${String(midnightDate.getMinutes()).padStart(2, '0')}`;

    // Last third of night = sunset + 2/3 of night
    const lastThirdTimestamp = sunsetTimestamp + (nightDurationMs * 2) / 3;
    const lastThirdDate = new Date(lastThirdTimestamp);
    const lastThird = `${String(lastThirdDate.getHours()).padStart(2, '0')}:${String(lastThirdDate.getMinutes()).padStart(2, '0')}`;

    return {
      dayKey,
      cityName,
      fajr: fajr.timeStr,
      sunrise: sunrise.timeStr,
      dhuhr: dhuhr.timeStr,
      asr: asr.timeStr,
      maghrib: maghrib.timeStr,
      isha: isha.timeStr,
      midnight,
      lastThird,
      fajrDate: fajr.date,
      sunriseDate: sunrise.date,
      dhuhrDate: dhuhr.date,
      asrDate: asr.date,
      maghribDate: maghrib.date,
      ishaDate: isha.date,
      nextFajrDate
    };
  }

  /**
   * Determines which prayer is next, remaining minutes, countdown, and progress percent.
   */
  static getNextPrayerInfo(times: DailyPrayerTimes): NextPrayerInfo {
    const now = EgyptDateTimeService.getCurrentCairoDate();
    const nowMs = now.getTime();

    const prayerSchedule: Array<{ prayer: PrayerType; arabic: string; date: Date }> = [
      { prayer: 'FAJR', arabic: 'الفجر', date: times.fajrDate },
      { prayer: 'DHUHR', arabic: 'الظهر', date: times.dhuhrDate },
      { prayer: 'ASR', arabic: 'العصر', date: times.asrDate },
      { prayer: 'MAGHRIB', arabic: 'المغرب', date: times.maghribDate },
      { prayer: 'ISHA', arabic: 'العشاء', date: times.ishaDate }
    ];

    // Find first prayer that is ahead of now
    for (let i = 0; i < prayerSchedule.length; i++) {
      const p = prayerSchedule[i];
      if (p.date.getTime() > nowMs) {
        const diffMs = p.date.getTime() - nowMs;
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const secs = Math.floor((diffMs % 60000) / 1000);

        // Previous prayer for progress calculation
        const prevDate = i === 0 ? new Date(times.fajrDate.getTime() - 6 * 3600000) : prayerSchedule[i - 1].date;
        const intervalTotalMs = p.date.getTime() - prevDate.getTime();
        const elapsedMs = nowMs - prevDate.getTime();
        const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / intervalTotalMs) * 100)));

        const countdownStr = hours > 0
          ? `${hours} س و ${mins} د`
          : `${mins} د و ${secs} ث`;

        const timeStr = `${String(p.date.getHours()).padStart(2, '0')}:${String(p.date.getMinutes()).padStart(2, '0')}`;

        return {
          nextPrayer: p.prayer,
          nextPrayerArabic: p.arabic,
          timeString: timeStr,
          remainingMinutes: totalMinutes,
          formattedCountdown: countdownStr,
          isToday: true,
          progressPercent: progress
        };
      }
    }

    // If past Isha, next is tomorrow's Fajr
    const nextFajrMs = times.nextFajrDate.getTime();
    const diffMs = Math.max(0, nextFajrMs - nowMs);
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = Math.floor((diffMs % 60000) / 1000);

    const elapsedMs = nowMs - times.ishaDate.getTime();
    const totalSpanMs = nextFajrMs - times.ishaDate.getTime();
    const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalSpanMs) * 100)));

    const countdownStr = hours > 0
      ? `${hours} س و ${mins} د`
      : `${mins} د و ${secs} ث`;

    const timeStr = `${String(times.nextFajrDate.getHours()).padStart(2, '0')}:${String(times.nextFajrDate.getMinutes()).padStart(2, '0')}`;

    return {
      nextPrayer: 'FAJR',
      nextPrayerArabic: 'الفجر (غدًا)',
      timeString: timeStr,
      remainingMinutes: totalMinutes,
      formattedCountdown: countdownStr,
      isToday: false,
      progressPercent: progress
    };
  }
}
