export const TRAINING_CATEGORIES = [
  'بدنسازی عمومی',
  'فیتنس و تناسب اندام',
  'برنامه اختصاصی مربی',
  'کاهش وزن و چربی‌سوزی',
  'پاورلیفتینگ و تمرینات قدرتی',
  'آمادگی مسابقات فیزیک / بادی‌بیلدینگ',
] as const;

export type TrainingCategory = typeof TRAINING_CATEGORIES[number];

export interface Athlete {
  id: string;
  firstName: string; // نام
  lastName: string; // نام خانوادگی
  photo?: string; // عکس پروفایل (base64 or URL)
  mobileNumber: string; // شماره موبایل (09xxxxxxxxx)
  nationalId: string; // کد ملی (10 رقم با اعتبارسنجی الگوریتم رسمی)
  birthDate: string; // تاریخ تولد جلالی (مثلا: ۱۳۷۸/۰۵/۱۴)
  registrationDate: string; // تاریخ ثبت‌نام جلالی (پیش‌فرض امروز)
  trainingCategory: TrainingCategory; // رشته و برنامه تمرینی (رسمی و قابل ویرایش)
  tuitionPaid: number; // شهریه پرداخت شده (تومان)
  tuitionUnpaid?: number; // شهریه باقی‌مانده / بدهی (اختیاری)
  lastUpdated: string; // ISO timestamp
  notes?: string; // یادداشت مربی یا شرایط بدنی
}

export type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'unpaid-first';

export type PaymentFilter = 'all' | 'unpaid' | 'paid';
