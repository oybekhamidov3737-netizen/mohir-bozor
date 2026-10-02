import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEB_URL } from './config';

const KEY = 'ref_code';
export const cleanRef = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

// Havoladan (?ref=KOD) taklif kodini olib saqlash
export async function captureRef(url) {
  if (!url) return;
  const m = /[?&]ref=([A-Za-z0-9]+)/.exec(url);
  if (m) await AsyncStorage.setItem(KEY, cleanRef(m[1]));
}
export const getStoredRef = async () => cleanRef(await AsyncStorage.getItem(KEY));
export const clearStoredRef = () => AsyncStorage.removeItem(KEY);
export const refLink = (code) => `${WEB_URL}/?ref=${code}`;
