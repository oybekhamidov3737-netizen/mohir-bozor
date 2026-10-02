// Ilova ochilganda: "m" chiqadi, sariq uchqun sakrab-sakrab joyiga borib o'rnashadi.
// Har sakrashda tovush, qo'nishda tebranish (vibratsiya).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { FONT } from './theme';

const ND = Platform.OS !== 'web';
const SOUNDS = {
  hop1: require('../assets/sounds/hop1.wav'),
  hop2: require('../assets/sounds/hop2.wav'),
  hop3: require('../assets/sounds/hop3.wav'),
  chime: require('../assets/sounds/chime.wav'),
};

// Logotip koordinatalari (intro-m.png ichida, 624 x 540 birlik)
const MW = 624, MH = 540;
const STAR = { x: 674, y: -56, size: 220 };
// Uchqunning yo'li: boshlanish → chap do'nglik → o'ng do'nglik → joyi (oxirgi joyga nisbatan)
const PATH = [
  { x: -824, y: 616 },
  { x: -468, y: 12, peak: -168, up: 300, down: 170 },
  { x: -256, y: 12, peak: -140, up: 150, down: 150 },
  { x: 0, y: 0, peak: -200, up: 180, down: 190 },
];

function haptic(kind) {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(kind === 'done' ? [20, 40, 30] : 12);
      return;
    }
    if (kind === 'done') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {}
}

export function Intro({ onDone }) {
  const { width, height } = useWindowDimensions();
  const L = Math.min(width * 0.46, 220);         // "m" kengligi
  const u = L / MW;
  const x = useRef(new Animated.Value(PATH[0].x * u)).current;
  const y = useRef(new Animated.Value(PATH[0].y * u)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const mIn = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const players = useRef({});
  const finished = useRef(false);

  const play = (k) => {
    try { const p = players.current[k]; if (p) { p.seekTo(0); p.play(); } } catch (e) {}
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(fade, { toValue: 0, duration: 320, useNativeDriver: ND }).start(() => onDone && onDone());
  };

  useEffect(() => {
    try { setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {}); } catch (e) {}
    try {
      Object.keys(SOUNDS).forEach((k) => {
        const p = createAudioPlayer(SOUNDS[k]);
        try { p.volume = k === 'chime' ? 0.55 : 0.45; } catch (e) {}
        players.current[k] = p;
      });
    } catch (e) {}

    const hop = (i) => new Promise((res) => {
      const to = PATH[i];
      play('hop' + i);
      Animated.parallel([
        Animated.timing(x, { toValue: to.x * u, duration: to.up + to.down, easing: Easing.linear, useNativeDriver: ND }),
        Animated.sequence([
          Animated.timing(y, { toValue: to.peak * u, duration: to.up, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
          Animated.timing(y, { toValue: to.y * u, duration: to.down, easing: Easing.in(Easing.quad), useNativeDriver: ND }),
        ]),
        Animated.timing(spin, { toValue: i, duration: to.up + to.down, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      ]).start(() => {
        const last = i === PATH.length - 1;
        haptic(last ? 'done' : i === 1 ? 'heavy' : 'light');
        if (last) play('chime');
        Animated.sequence([
          Animated.timing(squash, { toValue: last ? 0.7 : 0.78, duration: 70, useNativeDriver: ND }),
          Animated.spring(squash, { toValue: 1, friction: 3.5, tension: 160, useNativeDriver: ND }),
        ]).start();
        res();
      });
    });

    let alive = true;
    (async () => {
      await new Promise((r) => Animated.spring(mIn, { toValue: 1, friction: 6, tension: 70, useNativeDriver: ND }).start(r));
      for (let i = 1; i < PATH.length && alive; i++) await hop(i);
      if (!alive) return;
      Animated.parallel([
        Animated.timing(ring, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: ND }),
        Animated.timing(word, { toValue: 1, duration: 420, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: ND }),
      ]).start();
      setTimeout(() => alive && finish(), 1100);
    })();

    return () => {
      alive = false;
      Object.values(players.current).forEach((p) => { try { p.remove(); } catch (e) {} });
    };
  }, []);

  const S = STAR.size * u;
  const starLeft = STAR.x * u - S / 2;
  const starTop = STAR.y * u - S / 2;
  const rot = spin.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '270deg'] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 999 }]}>
      <Pressable onPress={finish} style={{ flex: 1 }} accessibilityLabel="O'tkazib yuborish">
        <Image source={require('../assets/intro-bg.png')} resizeMode="stretch" style={StyleSheet.absoluteFill} />
        <Animated.View style={{ position: 'absolute', left: (width - L) / 2, top: height / 2 - MH * u / 2 - 40, width: L, height: MH * u }}>
          <Animated.Image source={require('../assets/intro-m.png')} style={{
            width: L, height: MH * u, opacity: mIn,
            transform: [{ scale: mIn.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }} />
          {/* qo'nganda tarqaladigan halqa */}
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', left: starLeft, top: starTop, width: S, height: S, borderRadius: S / 2,
            borderWidth: 3, borderColor: '#FFC43D',
            opacity: ring.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.9, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.4] }) }],
          }} />
          <Animated.Image source={require('../assets/intro-star.png')} style={{
            position: 'absolute', left: starLeft, top: starTop, width: S, height: S,
            opacity: mIn,
            transform: [{ translateX: x }, { translateY: y }, { rotate: rot }, { scaleX: squash.interpolate({ inputRange: [0.7, 1], outputRange: [1.25, 1] }) }, { scaleY: squash }],
          }} />
        </Animated.View>
        <Animated.View style={{
          position: 'absolute', left: 0, right: 0, top: height / 2 + MH * u / 2 - 10, alignItems: 'center',
          opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 30, color: '#fff', letterSpacing: 0.5 }}>mohir bozor</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', letterSpacing: 3, marginTop: 6 }}>IJODKORLAR BOZORI</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Bir ochilishda bir marta (saytda — brauzer sessiyasida bir marta)
let shown = false;
export function shouldShowIntro() {
  if (shown) return false;
  shown = true;
  try {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('intro')) return false;
      sessionStorage.setItem('intro', '1');
    }
  } catch (e) {}
  return true;
}
