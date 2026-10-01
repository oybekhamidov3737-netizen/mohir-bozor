import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const publicUrl = (bucket, path) =>
  path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;

export const adPhoto = (ad, i = 0) => (ad && ad.photos && ad.photos[i] ? publicUrl('ads', ad.photos[i]) : null);

// Supabase xatolarini foydalanuvchiga tushunarli matnga aylantirish
export function errText(e) {
  const m = (e && (e.message || e.error_description)) || '';
  if (/Failed to fetch|Network request failed/i.test(m)) return "Internet bilan aloqa yo'q. Qayta urinib ko'ring.";
  if (/Gmail yoki iCloud|Database error saving new user/i.test(m)) return "Faqat Gmail yoki iCloud pochtasi bilan ro'yxatdan o'tish mumkin.";
  if (/Token has expired|invalid/i.test(m) && /otp|token/i.test(m)) return "Kod noto'g'ri yoki eskirgan. Yangi kod so'rang.";
  if (/rate limit|security purposes/i.test(m)) return "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.";
  return m || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}
