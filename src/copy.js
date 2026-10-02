import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Ishonchli nusxalash. iPhone Safari'da buyruq bosish paytining o'zida
// (await'siz) chaqirilishi kerak, aks holda rad etiladi.
export function copyText(text) {
  const s = String(text ?? '');
  if (Platform.OS !== 'web') return Clipboard.setStringAsync(s).then(() => true).catch(() => false);
  let ok = false;
  try {
    const ta = document.createElement('textarea');
    ta.value = s;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, s.length);
    ok = document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) { ok = false; }
  if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(s).then(() => true).catch(() => false);
  }
  return Promise.resolve(ok);
}
