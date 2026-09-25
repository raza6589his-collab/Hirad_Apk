import { Athlete } from '../types/athlete';

const STORAGE_KEY = 'hirad_fitness_athletes_v2';

export function getStoredAthletes(): Athlete[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default to empty roster for real production use by the coach
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
