// Supabase loyihangiz ma'lumotlari.
// Supabase → Project Settings → API bo'limidan oling.
// "anon public" kalit ochiq bo'lishi mumkin. "service_role" kalitni HECH QACHON bu yerga yozmang.
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

// Veb-sayt manzili (e'lon havolalarini ulashish uchun)
export const WEB_URL = 'https://oybekhamidov3737-netizen.github.io/mohir-bozor';

// Faqat shu pochtalar bilan kirish mumkin (server ham tekshiradi)
export const ALLOWED_EMAIL = /@(gmail\.com|icloud\.com|me\.com|mac\.com)$/i;

export const isConfigured = () => !SUPABASE_URL.includes('YOUR-PROJECT');
