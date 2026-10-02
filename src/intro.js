// Ilova ochilish animatsiyasi:
// 1) fonda yumshoq nurlar suzadi; 2) "m" harfi qismma-qism yig'iladi (ustunlar pastdan o'sadi, ravoqlar ochiladi);
// 3) sariq uchqun sakrab-sakrab do'ngliklarga qo'nadi (do'ngliklar egilib qaytadi) va joyiga o'rnashadi;
// 4) "mohir bozor" harfma-harf tushadi; 5) logo kattalashib, ilovaga o'tiladi.
// Har sakrashda tovush, qo'nishda tebranish.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

// "m" geometriyasi (624 x 540 birlik)
const MW = 624, MH = 540;
const SW = 112, R = 106, HS = SW / 2;
const XS = [100, 312, 524];      // ustunlar markazi
const YT = 200, YB = 440;        // ravoq markazi va ustun pasti
const ARCH = [206, 418];         // ravoqlar markazi
const STAR = { x: 674, y: -56, size: 220 };
// Uchqun yo'li (oxirgi joyiga nisbatan); hump — qaysi ravoqqa qo'nadi
const PATH = [
  { x: -824, y: 616 },
  { x: -468, y: 12, peak: -168, up: 300, down: 170, hump: 0 },
  { x: -256, y: 12, peak: -140, up: 150, down: 150, hump: 1 },
  { x: 0, y: 0, peak: -200, up: 180, down: 190 },
];
const WORD = 'mohir bozor';
const BOKEH = [
  { x: 0.12, y: 0.18, s: 0.55, d: 5200 }, { x: 0.82, y: 0.12, s: 0.35, d: 6100 },
  { x: 0.7, y: 0.78, s: 0.7, d: 7000 }, { x: 0.18, y: 0.82, s: 0.4, d: 5600 },
  { x: 0.5, y: 0.5, s: 0.9, d: 8000 }, { x: 0.92, y: 0.5, s: 0.28, d: 4800 },
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

const V = (v) => new Animated.Value(v);
const T = (val, toValue, duration, easing = Easing.out(Easing.cubic), delay = 0) =>
  Animated.timing(val, { toValue, duration, easing, delay, useNativeDriver: ND });
const SP = (val, toValue, friction = 5, tension = 120, delay = 0) =>
  Animated.spring(val, { toValue, friction, tension, delay, useNativeDriver: ND });
const run = (a) => new Promise((r) => a.start(r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function Intro({ onDone }) {
  const { width, height } = useWindowDimensions();
  const L = Math.min(width * 0.46, 220);
  const u = L / MW;

  const a = useRef(null);
  if (!a.current) {
    a.current = {
      x: V(PATH[0].x * u), y: V(PATH[0].y * u), spin: V(0), squash: V(1), starIn: V(0),
      stems: XS.map(() => V(1)),          // 1 = yashirin (pastda), 0 = joyida
      arches: ARCH.map(() => V(0)),       // ochilish
      dips: ARCH.map(() => V(0)),         // uchqun qo'nganda egilish
      pulse: V(1), ring: V(0), ring2: V(0),
      letters: WORD.split('').map(() => V(0)), sub: V(0),
      exit: V(0), bgIn: V(0), drift: BOKEH.map(() => V(0)),
    };
  }
  const A = a.current;
  const players = useRef({});
  const finished = useRef(false);

  const play = (k) => { try { const p = players.current[k]; if (p) { p.seekTo(0); p.play(); } } catch (e) {} };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    T(A.exit, 1, 480, Easing.in(Easing.cubic)).start(() => onDone && onDone());
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

    // Fon: nurlar to'xtovsiz suzadi
    T(A.bgIn, 1, 500).start();
    const loops = A.drift.map((d, i) => {
      const l = Animated.loop(Animated.sequence([
        T(d, 1, BOKEH[i].d, Easing.inOut(Easing.sin)),
        T(d, 0, BOKEH[i].d, Easing.inOut(Easing.sin)),
      ]));
      l.start();
      return l;
    });

    const hop = (i) => new Promise((res) => {
      const to = PATH[i];
      play('hop' + i);
      Animated.parallel([
        T(A.x, to.x * u, to.up + to.down, Easing.linear),
        Animated.sequence([
          T(A.y, to.peak * u, to.up, Easing.out(Easing.quad)),
          T(A.y, to.y * u, to.down, Easing.in(Easing.quad)),
        ]),
        T(A.spin, i, to.up + to.down, Easing.inOut(Easing.quad)),
      ]).start(() => {
        const last = i === PATH.length - 1;
        haptic(last ? 'done' : i === 1 ? 'heavy' : 'light');
        Animated.sequence([
          T(A.squash, last ? 0.7 : 0.78, 70, Easing.out(Easing.quad)),
          SP(A.squash, 1, 3.5, 160),
        ]).start();
        if (to.hump !== undefined) {
          const d = A.dips[to.hump];
          Animated.sequence([T(d, 1, 80, Easing.out(Easing.quad)), SP(d, 0, 3, 150)]).start();
        }
        if (last) {
          play('chime');
          Animated.parallel([
            T(A.ring, 1, 700),
            T(A.ring2, 1, 900, Easing.out(Easing.cubic), 140),
            Animated.sequence([T(A.pulse, 1.07, 120, Easing.out(Easing.quad)), SP(A.pulse, 1, 4, 140)]),
          ]).start();
        }
        res();
      });
    });

    let alive = true;
    (async () => {
      await wait(150);
      // "m" yig'iladi: ustunlar pastdan o'sadi, keyin ravoqlar ochiladi
      Animated.stagger(110, A.stems.map((s) => SP(s, 0, 6, 90))).start();
      await wait(260);
      await run(Animated.stagger(140, A.arches.map((ar) => SP(ar, 1, 5, 110))));
      if (!alive) return;
      T(A.starIn, 1, 200).start();
      for (let i = 1; i < PATH.length && alive; i++) await hop(i);
      if (!alive) return;
      Animated.parallel([
        Animated.stagger(45, A.letters.map((l) => SP(l, 1, 6, 140))),
        T(A.sub, 1, 420, Easing.out(Easing.cubic), 420),
      ]).start();
      await wait(1300);
      if (alive) finish();
    })();

    return () => {
      alive = false;
      loops.forEach((l) => l.stop());
      Object.values(players.current).forEach((p) => { try { p.remove(); } catch (e) {} });
    };
  }, []);

  const S = STAR.size * u;
  const starLeft = STAR.x * u - S / 2;
  const starTop = STAR.y * u - S / 2;
  const rot = A.spin.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '270deg'] });
  const logoTop = height / 2 - MH * u / 2 - 40;
  const dipOf = (i) => A.dips[i].interpolate({ inputRange: [0, 1], outputRange: [0, 14 * u] });
  // Ustun qaysi ravoqlarga tegishli: chap → 0, o'rta → 0 va 1, o'ng → 1
  const stemDip = [dipOf(0), Animated.add(dipOf(0), dipOf(1)), dipOf(1)];

  const bokeh = useMemo(() => BOKEH.map((b, i) => {
    const size = b.s * width;
    return (
      <Animated.View key={i} pointerEvents="none" style={{
        position: 'absolute', left: b.x * width - size / 2, top: b.y * height - size / 2, width: size, height: size, borderRadius: size / 2,
        backgroundColor: i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(120,150,255,0.18)',
        opacity: A.bgIn,
        transform: [
          { translateX: A.drift[i].interpolate({ inputRange: [0, 1], outputRange: [0, (i % 2 ? -1 : 1) * width * 0.08] }) },
          { translateY: A.drift[i].interpolate({ inputRange: [0, 1], outputRange: [0, (i % 3 ? 1 : -1) * height * 0.05] }) },
          { scale: A.drift[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
        ],
      }} />
    );
  }), [width, height]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 999, opacity: A.exit.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.9, 0] }) }]}>
      <Pressable onPress={finish} style={{ flex: 1, overflow: 'hidden', backgroundColor: '#2747D6' }} accessibilityLabel="O'tkazib yuborish">
        <Image source={require('../assets/intro-bg.png')} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width, height }} />
        {bokeh}

        <Animated.View style={{
          position: 'absolute', left: (width - L) / 2, top: logoTop, width: L, height: MH * u,
          transform: [
            { scale: Animated.multiply(A.pulse, A.exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] })) },
          ],
        }}>
          {/* Ustunlar: pastdan o'sib chiqadi */}
          {XS.map((cx, i) => (
            <Animated.View key={'s' + i} style={{ position: 'absolute', left: (cx - HS) * u, top: YT * u, width: SW * u, height: (YB + HS - YT) * u, overflow: 'hidden', transform: [{ translateY: stemDip[i] }] }}>
              <Animated.View style={{
                width: SW * u, height: (YB + HS - YT) * u, backgroundColor: '#fff',
                borderBottomLeftRadius: HS * u, borderBottomRightRadius: HS * u,
                transform: [{ translateY: A.stems[i].interpolate({ inputRange: [0, 1], outputRange: [0, (YB + HS - YT) * u] }) }],
              }} />
            </Animated.View>
          ))}
          {/* Ravoqlar: yarim halqa, pastdan ochiladi */}
          {ARCH.map((mx, i) => (
            <Animated.View key={'a' + i} style={{
              position: 'absolute', left: (mx - R - HS) * u, top: (YT - R - HS) * u, width: (2 * R + SW) * u, height: (R + HS) * u + 1, overflow: 'hidden',
              opacity: A.arches[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
              transform: [
                { translateY: dipOf(i) },
                { translateY: A.arches[i].interpolate({ inputRange: [0, 1], outputRange: [(R + HS) * u * 0.5, 0] }) },
                { scaleX: A.arches[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                { scaleY: A.arches[i] },
              ],
            }}>
              <View style={{ width: (2 * R + SW) * u, height: (2 * R + SW) * u, borderRadius: (R + HS) * u, borderWidth: SW * u, borderColor: '#fff' }} />
            </Animated.View>
          ))}

          {/* Qo'nganda tarqaladigan halqalar */}
          {[A.ring, A.ring2].map((rg, i) => (
            <Animated.View key={'r' + i} pointerEvents="none" style={{
              position: 'absolute', left: starLeft, top: starTop, width: S, height: S, borderRadius: S / 2,
              borderWidth: i ? 2 : 3, borderColor: i ? '#fff' : '#FFC43D',
              opacity: rg.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, i ? 0.6 : 0.95, 0] }),
              transform: [{ scale: rg.interpolate({ inputRange: [0, 1], outputRange: [0.4, i ? 3.2 : 2.4] }) }],
            }} />
          ))}
          <Animated.Image source={require('../assets/intro-star.png')} style={{
            position: 'absolute', left: starLeft, top: starTop, width: S, height: S,
            opacity: A.starIn,
            transform: [
              { translateX: A.x }, { translateY: A.y }, { rotate: rot },
              { scaleX: A.squash.interpolate({ inputRange: [0.7, 1], outputRange: [1.25, 1] }) }, { scaleY: A.squash },
            ],
          }} />
        </Animated.View>

        {/* "mohir bozor" harfma-harf tushadi */}
        <Animated.View style={{
          position: 'absolute', left: 0, right: 0, top: logoTop + MH * u + 30, alignItems: 'center',
          opacity: A.exit.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' }),
        }}>
          <View style={{ flexDirection: 'row' }}>
            {WORD.split('').map((ch, i) => (
              <Animated.Text key={i} style={{
                fontFamily: FONT.display, fontSize: 30, color: '#fff',
                opacity: A.letters[i],
                transform: [
                  { translateY: A.letters[i].interpolate({ inputRange: [0, 1], outputRange: [-26, 0] }) },
                  { scale: A.letters[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                ],
              }}>{ch === ' ' ? ' ' : ch}</Animated.Text>
            ))}
          </View>
          <Animated.Text style={{
            color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '700', letterSpacing: 3, marginTop: 8,
            opacity: A.sub, transform: [{ translateY: A.sub.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}>IJODKORLAR BOZORI</Animated.Text>
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
      if (typeof location !== 'undefined' && /[?&]intro\b/.test(location.search)) return true;
      if (sessionStorage.getItem('intro')) return false;
      sessionStorage.setItem('intro', '1');
    }
  } catch (e) {}
  return true;
}
