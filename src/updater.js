import { useEffect } from 'react';
import { Platform } from 'react-native';
import { WEB_URL } from './config';

const BUILD = process.env.EXPO_PUBLIC_BUILD || '';

// Veb-saytda yangi versiya chiqsa, sahifani o'zi yangilaydi
export const BUILD_ID = BUILD;

export function useAutoUpdate() {
  useEffect(() => {
    if (Platform.OS !== 'web' || !BUILD || typeof window === 'undefined') return;
    let busy = false;
    const check = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const r = await fetch(`${WEB_URL}/version.json?t=${Date.now()}`, { cache: 'no-store' });
        const j = await r.json();
        if (j.build && j.build !== BUILD) {
          const key = 'reloaded_' + j.build;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            // Oddiy reload keshdagi eski sahifani qaytarishi mumkin — manzilga versiya qo'shib ochamiz
            const u = new URL(window.location.href);
            u.searchParams.set('v', j.build);
            window.location.replace(u.toString());
          }
        }
      } catch (e) {}
      busy = false;
    };
    check();
    const iv = setInterval(check, 120000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);
}
