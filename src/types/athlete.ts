export const TRAINING_CATEGORIES = [
  'بدنسازی عمومی',
  'فیتنس و تناسب اندام',
  'برنامه اختصاصی مربی',
  'کاهش وزن و چربی‌سوزی',
  'پاورلیفتینگ و تمرینات قدرتی',
  'آمادگی مسابقات فیزیک / بادی‌بیلدینگ',
] as const;

export type TrainingCategory = typeof TRAINING_CATEGORIES[number];

export interface PaymentRecord {
  id: string;
  date: string; // تاریخ شمسی (مثلاً ۱۴۰۳/۰۷/۰۶)
  amount: number; // مبلغ به تومان
  type: 'payment' | 'charge'; // پرداخت شده یا بدهی دوره جدید
  title: string; // عنوان (مثلاً شهریه مهرماه، واریز کارت به کارت)
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // تاریخ شمسی (۱۴۰۳/۰۷/۰۶)
  time: string; // ساعت (۱۸:۳۰)
  sessionNumber: number; // شماره جلسه
  note?: string;
}

export interface Athlete {
  id: string;
  firstName: string; // نام
  lastName: string; // نام خانوادگی
  photo?: string; // عکس پروفایل (base64 or URL)
  mobileNumber: string; // شماره موبایل (09xxxxxxxxx)
  nationalId: string; // کد ملی (10 رقم با اعتبارسنجی الگوریتم رسمی)
  birthDate: string; // تاریخ تولد جلالی (مثلا: ۱۳۷۸/۰۵/۱۴)
  registrationDate: string; // تاریخ ثبت‌نام جلالی (پیش‌فرض امروز)
  trainingCategory: TrainingCategory; // رشته و برنامه تمرینی
  monthlyFee: number; // شهریه ماه جاری / مبلغ مصوب هر دوره (تومان)
  tuitionPaid: number; // کل مبالغ پرداخت شده (تومان)
  tuitionUnpaid?: number; // شهریه باقی‌مانده / بدهی (محاسبه خودکار)
  payments?: PaymentRecord[]; // تاریخچه پرداخت‌ها و شهریه‌ها
  attendances?: AttendanceRecord[]; // سوابق و تاریخ‌های جلسات حضور
  lastUpdated: string; // ISO timestamp
  notes?: string; // یادداشت مربی یا شرایط بدنی
}

export type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'unpaid-first';

export type PaymentFilter = 'all' | 'unpaid' | 'paid';
