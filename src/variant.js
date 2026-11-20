// Dizayn varianti (faqat sinov ko'rinishlari uchun): ?v=a — brend rangli tepa qism, ?v=b — yorug' tepa qism.
import { Platform } from 'react-native';

let v = 'a';
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const q = new URLSearchParams(window.location.search).get('v');
    if (q === 'a' || q === 'b') window.sessionStorage.setItem('mb_v', q);
    v = window.sessionStorage.getItem('mb_v') || v;
  } catch (e) {}
}
export const VARIANT = v;
export const BRAND_HEAD = v === 'a';
