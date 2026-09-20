/**
 * EgyptDateTimeService
 * Strict time-handling according to Egypt (Africa/Cairo) timezone.
 * Enforces weekly boundaries starting Friday 00:00 through Thursday 23:59.
 */

export const CAIRO_TIMEZONE = 'Africa/Cairo';

export class EgyptDateTimeService {
  /**
   * Extracts deterministic Cairo date & time parts using Intl.DateTimeFormat
   * independent of host device/browser timezone.
   */
  static getCairoParts(date: Date = new Date()): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: CAIRO_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    let year = 2026;
    let month = 1;
    let day = 1;
    let hour = 0;
    let minute = 0;
    let second = 0;

    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      else if (part.type === 'month') month = parseInt(part.value, 10);
      else if (part.type === 'day') day = parseInt(part.value, 10);
      else if (part.type === 'hour') {
        const h = parseInt(part.value, 10);
        hour = h === 24 ? 0 : h;
      }
      else if (part.type === 'minute') minute = parseInt(part.value, 10);
      else if (part.type === 'second') second = parseInt(part.value, 10);
    }

    return { year, month, day, hour, minute, second };
  }

  /**
   * Returns current Date in Cairo as a Date object aligned to Cairo local components.
   */
  static getCurrentCairoDate(date: Date = new Date()): Date {
    const { year, month, day, hour, minute, second } = this.getCairoParts(date);
    return new Date(year, month - 1, day, hour, minute, second);
  }

  /**
   * Returns current Cairo DayKey formatted as YYYY-MM-DD.
   */
  static getTodayKey(date: Date = new Date()): string {
    const { year, month, day } = this.getCairoParts(date);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  /**
   * Returns yesterday's DayKey (YYYY-MM-DD) in Cairo time.
   */
  static getYesterdayKey(todayKey?: string): string {
    if (todayKey) {
      const base = this.parseDayKey(todayKey);
      base.setDate(base.getDate() - 1);
      return this.toDayKey(base);
    }
    const { year, month, day } = this.getCairoParts();
    const base = new Date(year, month - 1, day, 12, 0, 0);
    base.setDate(base.getDate() - 1);
    return this.toDayKey(base);
  }

  /**
   * Parses YYYY-MM-DD into a local Date object.
   */
  static parseDayKey(dayKey: string): Date {
    const parts = dayKey.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return this.getCurrentCairoDate();
    }
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }

  /**
   * Converts a Date to YYYY-MM-DD.
   */
  static toDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a DayKey into rich Arabic text.
   * e.g., "الجمعة، 20 فبراير 2026"
   */
  static formatArabicFullDate(dayKey: string): string {
    try {
      const date = this.parseDayKey(dayKey);
      const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];

      const dayName = arabicDays[date.getDay()];
      const dayNum = date.getDate();
      const monthName = arabicMonths[date.getMonth()];
      const year = date.getFullYear();

      // Attempt Hijri approximation for Egypt
      const hijriStr = this.getHijriDateString(date);

      if (hijriStr) {
        return `${dayName}، ${dayNum} ${monthName} ${year} م (${hijriStr})`;
      }
      return `${dayName}، ${dayNum} ${monthName} ${year}`;
    } catch {
      return dayKey;
    }
  }

  /**
   * Formats day name in Arabic.
   */
  static formatArabicDayName(dayKey: string): string {
    try {
      const date = this.parseDayKey(dayKey);
      const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return arabicDays[date.getDay()];
    } catch {
      return '';
    }
  }

  static getDayNameArabic(dayKey: string): string {
    return this.formatArabicDayName(dayKey);
  }

  /**
   * Gets weekKey for any dayKey.
   * The week starts on Friday (00:00) and ends on Thursday (23:59).
   * WeekKey is the YYYY-MM-DD of the starting Friday.
   */
  static getWeekKeyForDate(dayKey: string): string {
    const date = this.parseDayKey(dayKey);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    // Calculate how many days back to Friday:
    // If Friday (5): 0 days back
    // If Saturday (6): 1 day back
    // If Sunday (0): 2 days back
    // If Monday (1): 3 days back
    // If Tuesday (2): 4 days back
    // If Wednesday (3): 5 days back
    // If Thursday (4): 6 days back
    const daysSinceFriday = (dayOfWeek + 2) % 7;
    date.setDate(date.getDate() - daysSinceFriday);
    return this.toDayKey(date);
  }

  /**
   * Returns the 7 days (YYYY-MM-DD) belonging to a weekKey (Friday to Thursday).
   */
  static getDaysForWeekKey(weekKey: string): string[] {
    const startDate = this.parseDayKey(weekKey);
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(this.toDayKey(d));
    }
    return days;
  }

  /**
   * Returns week start and end date formatted in Arabic.
   * e.g., "من الجمعة 18 سبتمبر إلى الخميس 24 سبتمبر"
   */
  static formatWeekRangeArabic(weekKey: string): string {
    const days = this.getDaysForWeekKey(weekKey);
    const startStr = this.formatArabicDayWithDate(days[0]);
    const endStr = this.formatArabicDayWithDate(days[6]);
    return `من ${startStr} إلى ${endStr}`;
  }

  static formatArabicDayWithDate(dayKey: string): string {
    try {
      const d = this.parseDayKey(dayKey);
      const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return `${arabicDays[d.getDay()]} ${d.getDate()} ${arabicMonths[d.getMonth()]}`;
    } catch {
      return dayKey;
    }
  }

  static formatArabicShortDate(dayKey: string): string {
    const d = this.parseDayKey(dayKey);
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${d.getDate()} ${arabicMonths[d.getMonth()]}`;
  }

  /**
   * Checks if a week has expired (current Cairo date is past the week's Thursday).
   */
  static isWeekExpired(weekKey: string, currentDayKey: string = this.getTodayKey()): boolean {
    const weekDays = this.getDaysForWeekKey(weekKey);
    const endThursdayKey = weekDays[6];
    return currentDayKey > endThursdayKey;
  }

  /**
   * Approximate Hijri Date representation for UI.
   */
  private static getHijriDateString(date: Date): string {
    try {
      // Intl format with islamic-umalqura or islamic
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return formatter.format(date);
    } catch {
      return '';
    }
  }
}
