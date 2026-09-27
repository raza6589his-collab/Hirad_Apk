import { Athlete } from '../types/athlete';

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
              date: ath.registrationDate || '۱۴۰۳/۰۱/۰۱',
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
