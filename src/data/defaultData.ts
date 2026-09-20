export interface DefaultHabitDef {
  key: string;
  titleArabic: string;
  defaultTarget: number;
  unitArabic: string;
  subtitleArabic: string;
  priority: number;
}

export interface DefaultCounterDef {
  key: string;
  titleArabic: string;
  transliterationArabic: string;
  defaultTarget: number;
  virtueArabic: string;
  priority: number;
}

export const DEFAULT_HABITS: DefaultHabitDef[] = [
  {
    key: 'quran_wird',
    titleArabic: 'ورد القرآن الكريم',
    defaultTarget: 1,
    unitArabic: 'جزء / صفحات',
    subtitleArabic: 'تلاوة أو حفظ أو تدبر',
    priority: 1
  },
  {
    key: 'duha_prayer',
    titleArabic: 'صلاة الضحى',
    defaultTarget: 2,
    unitArabic: 'ركعة',
    subtitleArabic: 'صلاة الأوابين (ركعتان على الأقل)',
    priority: 2
  },
  {
    key: 'sleep_azkar',
    titleArabic: 'أذكار النوم',
    defaultTarget: 1,
    unitArabic: 'مرة',
    subtitleArabic: 'آية الكرسي والمعوذات ودعاء النوم',
    priority: 3
  },
  {
    key: 'dua_daily',
    titleArabic: 'الدعاء وسؤال الله',
    defaultTarget: 1,
    unitArabic: 'مرة',
    subtitleArabic: 'ساعة إجابة أو تضرع في السجود',
    priority: 4
  },
  {
    key: 'witr_prayer',
    titleArabic: 'صلاة الوتر',
    defaultTarget: 1,
    unitArabic: 'ركعة',
    subtitleArabic: 'سنة مؤكدة قبل النوم أو في السحر',
    priority: 5
  },
  {
    key: 'night_prayer',
    titleArabic: 'قيام الليل',
    defaultTarget: 3,
    unitArabic: 'ركعات',
    subtitleArabic: 'نافلة الليل ولو ركعتين خفيفتين',
    priority: 6
  }
];

export const ALL_COUNTERS: DefaultCounterDef[] = [
  {
    key: 'counter_istighfar',
    titleArabic: 'الاستغفار',
    transliterationArabic: 'أستغفر الله العظيم وأتوب إليه',
    defaultTarget: 100,
    virtueArabic: 'مغفرة للذنوب وتفريج للكروب وسعة في الرزق',
    priority: 1
  },
  {
    key: 'counter_tasbih',
    titleArabic: 'التسبيح',
    transliterationArabic: 'سبحان الله وبحمده ، سبحان الله العظيم',
    defaultTarget: 100,
    virtueArabic: 'كلمتان خفيفتان على اللسان ثقيلتان في الميزان',
    priority: 2
  },
  {
    key: 'counter_tahmid',
    titleArabic: 'التحميد',
    transliterationArabic: 'الحمد لله رب العالمين',
    defaultTarget: 100,
    virtueArabic: 'الحمد لله تملأ الميزان',
    priority: 3
  },
  {
    key: 'counter_takbir',
    titleArabic: 'التكبير',
    transliterationArabic: 'الله أكبر كبيراً',
    defaultTarget: 100,
    virtueArabic: 'غرست له شجرة في الجنة',
    priority: 4
  },
  {
    key: 'counter_salat_nabi_morning',
    titleArabic: 'الصلاة على النبي (صباحًا)',
    transliterationArabic: 'اللهم صل وسلم على نبينا محمد',
    defaultTarget: 10,
    virtueArabic: 'من صلى عليّ صلاة صلى الله عليه بها عشراً',
    priority: 5
  },
  {
    key: 'counter_salat_nabi_evening',
    titleArabic: 'الصلاة على النبي (مساءً)',
    transliterationArabic: 'اللهم صل وسلم على نبينا محمد',
    defaultTarget: 10,
    virtueArabic: 'أدركته شفاعتي يوم القيامة',
    priority: 6
  },
  {
    key: 'counter_tahlil',
    titleArabic: 'التهليل',
    transliterationArabic: 'لا إله إلا الله وحده لا شريك له',
    defaultTarget: 100,
    virtueArabic: 'أفضل ما قلت أنا والنبيون من قبلي',
    priority: 7
  },
  {
    key: 'counter_hawqalah',
    titleArabic: 'الحوقلة',
    transliterationArabic: 'لا حول ولا قوة إلا بالله العلي العظيم',
    defaultTarget: 100,
    virtueArabic: 'كنز من كنوز الجنة ودواء لتسعة وتسعين داء',
    priority: 8
  }
];

export const PrayerReasons = {
  INDIVIDUAL_REASONS: [
    'ظروف العمل أو الدراسة',
    'استيقاظ متأخر قليلًا',
    'المسجد بعيد عن المكان',
    'زحام أو تعب وإرهاق جسدي',
    'رعاية الأهل أو الأطفال',
    'كسل أو تسويف',
    'سبب آخر'
  ],

  MISSED_REASONS: [
    'غلبني النوم',
    'نسيان وسهو غير مقصود',
    'انشغال شديد بالعمل أو الدراسة',
    'خارج المنزل دون طهارة أو مكان للصلاة',
    'تسويف وتكاسل',
    'سبب آخر'
  ],

  REFLECTION_STRUGGLE_REASONS: [
    'تعب بدني وقلة نوم',
    'انشغال بالعمل أو التزامات عائلية',
    'تشتت بالهاتف ومواقع التواصل',
    'غياب التخطيط المسبق للوقت',
    'فتور وضعف همة عابر',
    'سبب آخر'
  ]
};
