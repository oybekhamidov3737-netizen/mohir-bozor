// Apple "Liquid Glass" uslubidagi shaffof shisha — sayt versiyasi.
// Orqadagi kontent xiralashib (blur) va rangi to'yinib ko'rinadi; chetida yorug' "qirra" bor.
import React from 'react';
import { View } from 'react-native';

// backdrop-filter'ni ishonchli qo'llash uchun umumiy CSS (data-glass atributi orqali)
if (typeof document !== 'undefined' && !document.getElementById('mb-glass-css')) {
  const st = document.createElement('style');
  st.id = 'mb-glass-css';
  st.textContent = [
    '[data-glass]{-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%)}',
    '[data-glass="thin"]{-webkit-backdrop-filter:blur(12px) saturate(170%);backdrop-filter:blur(12px) saturate(170%)}',
    '[data-glass-tabbar]{-webkit-user-select:none;user-select:none;touch-action:pan-y}',
  ].join('');
  document.head.appendChild(st);
}

export const GLASS_NATIVE_BLUR = false;

export function glassColors(dark, tone = 'regular') {
  if (tone === 'clear') {
    return dark
      ? { bg: 'rgba(20,24,22,0.38)', border: 'rgba(255,255,255,0.16)', hi: 'rgba(255,255,255,0.10)' }
      : { bg: 'rgba(255,255,255,0.42)', border: 'rgba(255,255,255,0.8)', hi: 'rgba(255,255,255,0.9)' };
  }
  return dark
    ? { bg: 'rgba(24,30,27,0.6)', border: 'rgba(255,255,255,0.12)', hi: 'rgba(255,255,255,0.08)' }
    : { bg: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.85)', hi: 'rgba(255,255,255,0.95)' };
}

export function Glass({ style, children, dark, tone = 'regular', thin, shadow = true, dataSet, ...rest }) {
  const c = glassColors(dark, tone);
  return (
    <View {...rest} dataSet={{ glass: thin ? 'thin' : 'regular', ...(dataSet || {}) }} style={[{
      backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, overflow: 'hidden',
      backdropFilter: thin ? 'blur(12px) saturate(170%)' : 'blur(22px) saturate(185%)',
      WebkitBackdropFilter: thin ? 'blur(12px) saturate(170%)' : 'blur(22px) saturate(185%)',
      boxShadow: (shadow ? (dark ? '0 12px 32px rgba(0,0,0,0.45), ' : '0 12px 32px rgba(18,32,80,0.16), ') : '')
        + `inset 0 1px 0 ${c.hi}, inset 0 -1px 0 rgba(255,255,255,${dark ? 0.04 : 0.35})`,
    }, style]}>
      {children}
    </View>
  );
}
