import { EgyptDateTimeService } from '../datetime/EgyptDateTimeService';

/**
 * NotificationService.ts
 * نظام تنبيهات هادئ، غير متكرر ولا يحمل أي تأنيب أو ضغط.
 * يحترم خصوصية المستخدم ووقت فراغه.
 */

export class NotificationService {
  private static STORAGE_KEY_LAST_NOTIF = 'ahl_al_quran_last_gentle_notif';

  /**
   * طلب إذن التنبيهات
   */
  public static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * إرسال تذكير هادئ بمراجعة الأيام غير المحسومة إن وُجدت
   * مع ضمان عدم التكرار في نفس اليوم (مرة واحدة يوميًا على الأكثر) بناءً على توقيت مصر
   */
  public static sendGentleReviewReminderIfNeeded(pendingDaysCount: number): void {
    if (pendingDaysCount <= 0) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const todayStr = EgyptDateTimeService.getTodayKey();
      const lastSent = localStorage.getItem(this.STORAGE_KEY_LAST_NOTIF);

      // منع التكرار في نفس اليوم بتوقيت مصر
      if (lastSent === todayStr) {
        return;
      }

      const title = 'أهل القرآن 🤍 تذكير هادئ';
      const body =
        pendingDaysCount === 1
          ? 'لديك يوم سابق يمكنك مراجعته وتدوينه بهدوء متى تيسر لك وقت الفراغ.'
          : `لديك ${pendingDaysCount} أيام سابقة ما زالت بعض بياناتها بحاجة لتسجيل. راجعها بهدوء وسكينة.`;

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'gentle_review_reminder',
        silent: true
      });

      localStorage.setItem(this.STORAGE_KEY_LAST_NOTIF, todayStr);
    } catch {
      // Ignored safely if notification fails or tab is backgrounded
    }
  }
}
