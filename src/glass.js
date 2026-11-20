// Apple "Liquid Glass" uslubidagi shaffof shisha — telefon ilovasi versiyasi.
// iPhone: tizimning haqiqiy xiralashtirish materiali (expo-blur). Android: yarim shaffof sirt.
import React from 'react';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';

export const GLASS_NATIVE_BLUR = Platform.OS === 'ios';

export function glassColors(dark, tone = 'regular') {
  if (tone === 'clear') {
    return dark
      ? { bg: 'rgba(20,24,22,0.30)', border: 'rgba(255,255,255,0.16)', hi: 'rgba(255,255,255,0.10)' }
      : { bg: 'rgba(255,255,255,0.30)', border: 'rgba(255,255,255,0.8)', hi: 'rgba(255,255,255,0.9)' };
  }
  return dark
    ? { bg: 'rgba(24,30,27,0.45)', border: 'rgba(255,255,255,0.12)', hi: 'rgba(255,255,255,0.08)' }
    : { bg: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.85)', hi: 'rgba(255,255,255,0.95)' };
}

export function Glass({ style, children, dark, tone = 'regular', thin, shadow, dataSet, ...rest }) {
  const c = glassColors(dark, tone);
  if (Platform.OS === 'ios') {
    return (
      <BlurView {...rest} intensity={thin ? 40 : 70} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        style={[{ overflow: 'hidden', borderWidth: 1, borderColor: c.border, backgroundColor: tone === 'clear' ? c.bg : 'transparent' }, style]}>
        {children}
      </BlurView>
    );
  }
  // Android: xiralashtirish og'ir — deyarli shaffof bo'lmagan sirt
  return (
    <View {...rest} style={[{ overflow: 'hidden', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
      backgroundColor: dark ? 'rgba(26,32,29,0.94)' : 'rgba(255,255,255,0.95)' }, style]}>
      {children}
    </View>
  );
}
