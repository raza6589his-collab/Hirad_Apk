import { Athlete } from '../types/athlete';
import { getTodayJalali } from './jalali';

const STORAGE_KEY = 'hirad_fitness_athletes_v2';

export function getStoredAthletes(): Athlete[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Ensure backwards compatibility with newly added fields
    return parsed.map((ath: any): Athlete => {
      const monthlyFee = ath.monthlyFee || (ath.tuitionPaid || 0) + (ath.tuitionUnpaid || 0) || 1500000;
      const payments = Array.isArray(ath.payments)
        ? ath.payments
        : (ath.tuitionPaid || 0) > 0
        ? [
            {
              id: 'init-payment-' + ath.id,
              date: ath.registrationDate || getTodayJalali().formatted,
              amount: ath.tuitionPaid,
              type: 'payment',
              title: 'پرداخت اولیه هنگام ثبت‌نام',
            },
          ]
        : [];
      const attendances = Array.isArray(ath.attendances) ? ath.attendances : [];

      return {
        ...ath,
        monthlyFee,
        tuitionPaid: ath.tuitionPaid || 0,
        tuitionUnpaid: typeof ath.tuitionUnpaid === 'number' ? ath.tuitionUnpaid : Math.max(0, monthlyFee - (ath.tuitionPaid || 0)),
        payments,
        attendances,
      };
    });
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return [];
  }
}

export function saveStoredAthletes(athletes: Athlete[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function clearAllAthletes(): Athlete[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// Background Customization & Preset Themes
// -------------------------------------------------------------
export interface PresetBackground {
  id: string;
  name: string;
  style: string;
  preview: string;
  description: string;
}

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  {
    id: 'carbon_sport',
    name: 'تکسچر کربن ورزشی',
    style: 'radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 8px 8px, radial-gradient(rgba(255,255,255,.08) 15%, transparent 20%) 0 1px, radial-gradient(rgba(255,255,255,.08) 15%, transparent 20%) 8px 9px; background-size: 16px 16px; background-color: #0b1120;',
    preview: 'linear-gradient(135deg, #0b1120 0%, #1e293b 100%)',
    description: 'بافت تاریک و حرفه‌ای فیبر کربن مخصوص باشگاه‌های ورزشی',
  },
  {
    id: 'amber_gold',
    name: 'طلایی و کهربایی هیراد',
    style: 'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.28), transparent 70%), radial-gradient(ellipse at bottom left, rgba(217, 119, 6, 0.2), transparent 60%), linear-gradient(180deg, #090d16 0%, #030712 100%)',
    preview: 'linear-gradient(135deg, #d97706 0%, #090d16 100%)',
    description: 'طیف رنگی لوکس مشکی و طلایی اختصاصی برند هیراد',
  },
  {
    id: 'iron_slate',
    name: 'سنگ آهن و بتن',
    style: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
    preview: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    description: 'تم مینیمال، قدرتمند و تاریک تیتانیوم و بتن ورزشی',
  },
  {
    id: 'midnight_neon',
    name: 'نئون و انرژی شبانه',
    style: 'radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.2), transparent 45%), radial-gradient(circle at 15% 85%, rgba(249, 115, 22, 0.22), transparent 45%), #050b14',
    preview: 'linear-gradient(135deg, #0284c7 0%, #ea580c 100%)',
    description: 'هاله نورانی مدرن نئون آبی و نارنجی مسابقه‌ای',
  },
  {
    id: 'champion_emerald',
    name: 'زمرد قهرمانی',
    style: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.22), transparent 60%), linear-gradient(180deg, #06241b 0%, #02120e 100%)',
    preview: 'linear-gradient(135deg, #059669 0%, #02120e 100%)',
    description: 'سبز زمردی عمیق نماد سلامت، انرژی و پیروزی',
  },
  {
    id: 'deep_oled',
    name: 'مشکی خالص مات (OLED)',
    style: 'linear-gradient(180deg, #09090b 0%, #000000 100%)',
    preview: 'linear-gradient(180deg, #18181b 0%, #000000 100%)',
    description: 'مشکی مطلق و شیک جهت بیشترین خوانایی و کاهش مصرف باتری',
  },
];

const BACKGROUND_STORAGE_KEY = 'hirad_custom_background_v1';

export interface AppBackgroundConfig {
  type: 'default' | 'preset' | 'custom';
  presetId?: string;
  customDataUrl?: string;
  overlayOpacity: number; // e.g. 0.45 (0 to 1)
  blur: number; // 0 to 10 px
}

export const DEFAULT_BACKGROUND_CONFIG: AppBackgroundConfig = {
  type: 'default',
  overlayOpacity: 0.45,
  blur: 0,
};

export function getStoredBackground(): AppBackgroundConfig {
  try {
    const raw = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (!raw) return DEFAULT_BACKGROUND_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      type: parsed.type || 'default',
      presetId: parsed.presetId,
      customDataUrl: parsed.customDataUrl,
      overlayOpacity: typeof parsed.overlayOpacity === 'number' ? parsed.overlayOpacity : 0.45,
      blur: typeof parsed.blur === 'number' ? parsed.blur : 0,
    };
  } catch {
    return DEFAULT_BACKGROUND_CONFIG;
  }
}

export function saveStoredBackground(config: AppBackgroundConfig): void {
  try {
    localStorage.setItem(BACKGROUND_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save background config:', err);
  }
}

// -------------------------------------------------------------
// Backup & Restore System
// -------------------------------------------------------------
export interface BackupData {
  app: string;
  version: string;
  exportDateJalali: string;
  exportDateIso: string;
  clubName: string;
  coachName: string;
  totalAthletes: number;
  totalPayments: number;
  totalAttendances: number;
  athletes: Athlete[];
  backgroundConfig?: AppBackgroundConfig;
}

export function generateBackupData(athletes: Athlete[]): BackupData {
  const today = getTodayJalali();
  const totalPayments = athletes.reduce((sum, a) => sum + (a.payments?.length || 0), 0);
  const totalAttendances = athletes.reduce((sum, a) => sum + (a.attendances?.length || 0), 0);

  return {
    app: 'Hirad Fitness Club Athlete Management',
    version: '1.4.0',
    exportDateJalali: today.formatted,
    exportDateIso: new Date().toISOString(),
    clubName: 'باشگاه بدنسازی هیراد',
    coachName: 'عبداللهی',
    totalAthletes: athletes.length,
    totalPayments,
    totalAttendances,
    athletes,
    backgroundConfig: getStoredBackground(),
  };
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  data?: BackupData;
  summary?: {
    totalAthletes: number;
    totalPayments: number;
    totalAttendances: number;
    exportDateJalali: string;
  };
}

export function validateBackupData(parsed: any): BackupValidationResult {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'ساختار فایل پشتیبان نامعتبر است (فرمت JSON معتبر نیست).' };
  }

  // Check if athletes array exists
  if (!Array.isArray(parsed.athletes)) {
    return { valid: false, error: 'فایل پشتیبان فاقد لیست ورزشکاران است.' };
  }

  // Validate each athlete basic properties
  const validAthletes = parsed.athletes.filter(
    (a: any) => a && typeof a === 'object' && a.id && a.firstName && a.lastName
  );

  if (parsed.athletes.length > 0 && validAthletes.length === 0) {
    return { valid: false, error: 'اطلاعات ورزشکاران درون فایل پشتیبان معتبر نیستند.' };
  }

  const totalPayments = parsed.athletes.reduce((sum: number, a: any) => sum + (a.payments?.length || 0), 0);
  const totalAttendances = parsed.athletes.reduce((sum: number, a: any) => sum + (a.attendances?.length || 0), 0);

  return {
    valid: true,
    data: parsed as BackupData,
    summary: {
      totalAthletes: parsed.athletes.length,
      totalPayments,
      totalAttendances,
      exportDateJalali: parsed.exportDateJalali || 'نامشخص',
    },
  };
}

export function restoreBackupData(
  backup: BackupData,
  currentAthletes: Athlete[],
  mode: 'replace' | 'merge'
): Athlete[] {
  let finalAthletes: Athlete[] = [];

  if (mode === 'replace') {
    finalAthletes = backup.athletes;
  } else {
    // Merge: update existing by ID or add new
    const map = new Map<string, Athlete>();
    currentAthletes.forEach((a) => map.set(a.id, a));
    backup.athletes.forEach((incoming) => {
      // If athlete with same ID exists, merge incoming payments and attendances
      if (map.has(incoming.id)) {
        const existing = map.get(incoming.id)!;
        const mergedPayments = [...(incoming.payments || [])];
        (existing.payments || []).forEach((p) => {
          if (!mergedPayments.some((mp) => mp.id === p.id)) {
            mergedPayments.push(p);
          }
        });
        const mergedAttendances = [...(incoming.attendances || [])];
        (existing.attendances || []).forEach((att) => {
          if (!mergedAttendances.some((ma) => ma.id === att.id)) {
            mergedAttendances.push(att);
          }
        });

        map.set(incoming.id, {
          ...existing,
          ...incoming,
          payments: mergedPayments,
          attendances: mergedAttendances,
        });
      } else {
        map.set(incoming.id, incoming);
      }
    });
    finalAthletes = Array.from(map.values());
  }

  // Save athletes to localStorage
  saveStoredAthletes(finalAthletes);

  // Restore background config if available
  if (backup.backgroundConfig) {
    saveStoredBackground(backup.backgroundConfig);
  }

  return finalAthletes;
}
