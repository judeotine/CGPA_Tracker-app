import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SemesterWithCourses, Profile } from '../types';

const STORAGE_KEYS = {
  SEMESTERS: '@cgpa_tracker_semesters',
  PROFILE: '@cgpa_tracker_profile',
  PENDING_SYNC: '@cgpa_tracker_pending_sync',
  LAST_SYNC: '@cgpa_tracker_last_sync',
} as const;

interface PendingSyncItem {
  id: string;
  type: 'semester' | 'course' | 'profile';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

export async function saveSemestersLocally(semesters: SemesterWithCourses[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(semesters));
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save semesters locally:', error);
  }
}

export async function loadSemestersLocally(): Promise<SemesterWithCourses[] | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SEMESTERS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load semesters locally:', error);
    return null;
  }
}

export async function saveProfileLocally(profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save profile locally:', error);
  }
}

export async function loadProfileLocally(): Promise<Profile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load profile locally:', error);
    return null;
  }
}

export async function addPendingSync(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): Promise<void> {
  try {
    const existing = await getPendingSyncItems();
    const newItem: PendingSyncItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    existing.push(newItem);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to add pending sync item:', error);
  }
}

export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get pending sync items:', error);
    return [];
  }
}

export async function removePendingSyncItem(id: string): Promise<void> {
  try {
    const items = await getPendingSyncItems();
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending sync item:', error);
  }
}

export async function clearPendingSyncItems(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  } catch (error) {
    console.error('Failed to clear pending sync items:', error);
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
}

export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function clearAllLocalData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SEMESTERS,
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.PENDING_SYNC,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Failed to clear local data:', error);
  }
}
