// Saytdagi kirish animatsiyasi: brauzerning CSS animatsiyalarida (kompozitorda) ishlaydi,
// shuning uchun orqada sahifa yuklanayotganda ham qotmaydi.
// Mantiq va vaqtlar src/intro.js (telefon ilovasi) bilan bir xil.
import React, { useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { tr } from './i18n';

const SOUNDS = {
  hop1: require('../assets/sounds/hop1.wav'),
  hop2: require('../assets/sounds/hop2.wav'),
  hop3: require('../assets/sounds/hop3.wav'),
  chime: require('../assets/sounds/chime.wav'),
};
const STAR_IMG = require('../assets/intro-star.png');
const srcOf = (m) => (typeof m === 'string' ? m : m?.uri || m?.default || '');

const MW = 624, MH = 540, SW = 112, R = 106, HS = SW / 2;
const XS = [100, 312, 524], YT = 200, YB = 440, ARCH = [206, 418];
const STAR = { x: 674, y: -56, size: 220 };
const P0 = { x: -824, y: 616 };
const H = [
  { x: -468, y: 12, peak: -168, up: 300, down: 170 },
  { x: -256, y: 12, peak: -140, up: 150, down: 150 },
  { x: 0, y: 0, peak: -200, up: 180, down: 190 },
];
const WORD = 'mohir bozor';

// Vaqt jadvali (ms)
const STAR0 = 1000;
const HOP_T = H.map((h) => h.up + h.down);               // 470, 300, 370
const LAND = HOP_T.reduce((a, d) => [...a, (a[a.length - 1] || 0) + d], []); // 470, 770, 1140
const STAR_DUR = LAND[2];
const FX_DUR = STAR_DUR + 320;
const FINAL = STAR0 + STAR_DUR;
const EXIT = FINAL + 1150;
const DONE = EXIT + 480;

const pct = (ms, total) => ((ms / total) * 100).toFixed(2) + '%';
const OUT = 'cubic-bezier(.2,.7,.3,1)';
const IN = 'cubic-bezier(.55,0,.8,.4)';
const BOUNCE = 'cubic-bezier(.34,1.56,.64,1)';

// iOS 18+ Safari: "switch" belgisini bosish yengil tebranish beradi (boshqa yo'l yo'q)
function haptic(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate && navigator.vibrate(pattern)) return;
    const l = document.createElement('label');
    const i = document.createElement('input');
    i.type = 'checkbox'; i.setAttribute('switch', '');
    l.appendChild(i); l.style.display = 'none';
    document.body.appendChild(l); l.click(); l.remove();
  } catch (e) {}
}

function css(u, L) {
  const s = (v) => (v * u).toFixed(1) + 'px';
  const t = (ms) => pct(ms, STAR_DUR);
  const f = (ms) => pct(ms, FX_DUR);
  let x = `@keyframes mbX{0%{transform:translateX(${s(P0.x)});opacity:0}4%{opacity:1}`;
  let y = `@keyframes mbY{0%{transform:translateY(${s(P0.y)});animation-timing-function:${OUT}}`;
  let r = `@keyframes mbR{0%{transform:rotate(0)}`;
  let start = 0;
  H.forEach((h, i) => {
    x += `${t(LAND[i])}{transform:translateX(${s(h.x)});opacity:1}`;
    y += `${t(start + h.up)}{transform:translateY(${s(h.peak)});animation-timing-function:${IN}}`;
    y += `${t(LAND[i])}{transform:translateY(${s(h.y)});animation-timing-function:${OUT}}`;
    r += `${t(LAND[i])}{transform:rotate(${90 * (i + 1)}deg)}`;
    start = LAND[i];
  });
  x += '}'; y += '}'; r += '}';
  // Qo'nishda siqilish
  let q = `@keyframes mbQ{0%{transform:scale(1,1)}`;
  LAND.forEach((ms, i) => {
    const last = i === 2;
    q += `${f(ms)}{transform:scale(1,1)}${f(ms + 40)}{transform:scale(${last ? 1.3 : 1.22},${last ? 0.7 : 0.78})}`;
    q += `${f(ms + 120)}{transform:scale(.94,1.07)}${f(ms + 200)}{transform:scale(1.02,.98)}${f(ms + 260)}{transform:scale(1,1)}`;
  });
  q += '100%{transform:scale(1,1)}}';
  // Do'ngliklarning egilishi
  const dip = (name, lands) => {
    let k = `@keyframes ${name}{0%{transform:translateY(0)}`;
    lands.forEach((ms) => {
      k += `${f(ms)}{transform:translateY(0)}${f(ms + 70)}{transform:translateY(${s(14)})}`;
      k += `${f(ms + 170)}{transform:translateY(${s(-4)})}${f(ms + 250)}{transform:translateY(0)}`;
    });
    return k + '100%{transform:translateY(0)}}';
  };
  return `
${x}${y}${r}${q}
${dip('mbD0', [LAND[0]])}${dip('mbD1', [LAND[1]])}${dip('mbD01', [LAND[0], LAND[1]])}
@keyframes mbStem{0%{transform:translateY(100%)}100%{transform:translateY(0)}}
@keyframes mbArch{0%{transform:translateY(40%) scale(.2,0);opacity:0}30%{opacity:1}100%{transform:translateY(0) scale(1,1);opacity:1}}
@keyframes mbRing{0%{transform:scale(.4);opacity:0}8%{opacity:.95}100%{transform:scale(2.4);opacity:0}}
@keyframes mbRing2{0%{transform:scale(.4);opacity:0}8%{opacity:.6}100%{transform:scale(3.2);opacity:0}}
@keyframes mbPulse{0%{transform:scale(1)}30%{transform:scale(1.07)}60%{transform:scale(.98)}100%{transform:scale(1)}}
@keyframes mbLetter{0%{transform:translateY(-26px) scale(.4);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes mbSub{0%{transform:translateY(10px);opacity:0}100%{transform:translateY(0);opacity:.78}}
@keyframes mbZoom{0%{transform:scale(1)}100%{transform:scale(1.6)}}
@keyframes mbFade{0%{opacity:1}60%{opacity:.9}100%{opacity:0}}
@keyframes mbWordOut{0%{opacity:1}50%,100%{opacity:0}}
@keyframes mbBg{0%{opacity:0}100%{opacity:1}}
@keyframes mbDrift{0%{transform:translate(0,0) scale(1)}100%{transform:translate(var(--dx),var(--dy)) scale(1.15)}}
.mb-a{animation-fill-mode:both;will-change:transform,opacity}
`;
}

export function Intro({ onDone }) {
  const { width, height } = useWindowDimensions();
  const L = Math.min(width * 0.46, 220);
  const u = L / MW;
  const style = useMemo(() => css(u, L), [u, L]);
  const done = useRef(false);
  const timers = useRef([]);
  const root = useRef(null);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    timers.current.forEach(clearTimeout);
    onDone && onDone();
  };

  const skip = () => {
    // Bosilsa: tezda yo'qoladi
    if (root.current) { root.current.style.transition = 'opacity .3s'; root.current.style.opacity = '0'; }
    timers.current.push(setTimeout(finish, 300));
  };

  useEffect(() => {
    const players = {};
    try { Object.keys(SOUNDS).forEach((k) => { players[k] = createAudioPlayer(SOUNDS[k]); try { players[k].volume = k === 'chime' ? 0.55 : 0.45; } catch (e) {} }); } catch (e) {}
    const play = (k) => { try { players[k].seekTo(0); players[k].play(); } catch (e) {} };
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    let st = 0;
    H.forEach((h, i) => { at(STAR0 + st, () => play('hop' + (i + 1))); st = LAND[i]; });
    LAND.forEach((ms, i) => at(STAR0 + ms, () => haptic(i === 2 ? [20, 40, 30] : 12)));
    at(FINAL, () => play('chime'));
    at(DONE, finish);
    return () => {
      timers.current.forEach(clearTimeout);
      Object.values(players).forEach((p) => { try { p.remove(); } catch (e) {} });
    };
  }, []);

  const S = STAR.size * u;
  const sl = STAR.x * u - S / 2, stp = STAR.y * u - S / 2;
  const logoTop = height / 2 - MH * u / 2 - 40;
  const A = (name, dur, delay = 0, ease = 'linear', extra = {}) => ({
    animationName: name, animationDuration: dur + 'ms', animationDelay: delay + 'ms', animationTimingFunction: ease, ...extra,
  });
  const abs = { position: 'absolute' };
  const stemDip = ['mbD0', 'mbD01', 'mbD1'];
  const archDip = ['mbD0', 'mbD1'];

  return (
    <div ref={root} onClick={skip} role="button" aria-label="O'tkazib yuborish"
      className="mb-a" style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', cursor: 'pointer',
        background: 'linear-gradient(160deg,#4068FF 0%,#2747D6 55%,#122CB0 100%)',
        ...A('mbFade', 480, EXIT, 'cubic-bezier(.55,0,1,.45)') }}>
      <style>{style}</style>

      {/* Fon nurlari */}
      {[[.12, .18, .55, 5200], [.82, .12, .35, 6100], [.7, .78, .7, 7000], [.18, .82, .4, 5600], [.5, .5, .9, 8000], [.92, .5, .28, 4800]].map(([bx, by, bs, d], i) => {
        const size = bs * width;
        return (
          <div key={i} className="mb-a" style={{ ...abs, left: bx * width - size / 2, top: by * height - size / 2, width: size, height: size, borderRadius: '50%',
            background: i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(120,150,255,0.13)',
            '--dx': ((i % 2 ? -1 : 1) * width * 0.08) + 'px', '--dy': ((i % 3 ? 1 : -1) * height * 0.05) + 'px',
            animation: `mbBg 500ms ease-out both, mbDrift ${d}ms ease-in-out ${-i * 700}ms infinite alternate` }} />
        );
      })}

      {/* Logo */}
      <div className="mb-a" style={{ ...abs, left: (width - L) / 2, top: logoTop, width: L, height: MH * u, ...A('mbZoom', 480, EXIT, 'cubic-bezier(.55,0,1,.45)') }}>
        <div className="mb-a" style={{ ...abs, inset: 0, ...A('mbPulse', 420, FINAL, 'ease-out') }}>
          {XS.map((cx, i) => (
            <div key={'s' + i} className="mb-a" style={{ ...abs, left: (cx - HS) * u, top: (YT - 3) * u, width: SW * u, height: (YB + HS - YT + 3) * u, overflow: 'hidden', ...A(stemDip[i], FX_DUR, STAR0) }}>
              <div className="mb-a" style={{ width: '100%', height: '100%', background: '#fff', borderRadius: `0 0 ${HS * u}px ${HS * u}px`, ...A('mbStem', 560, 150 + i * 110, BOUNCE) }} />
            </div>
          ))}
          {ARCH.map((mx, i) => (
            <div key={'a' + i} className="mb-a" style={{ ...abs, left: (mx - R - HS) * u, top: (YT - R - HS) * u, width: (2 * R + SW) * u, height: (R + HS) * u + 1, ...A(archDip[i], FX_DUR, STAR0) }}>
              <div className="mb-a" style={{ width: '100%', height: '100%', overflow: 'hidden', transformOrigin: '50% 100%', ...A('mbArch', 480, 420 + i * 140, BOUNCE) }}>
                <div style={{ width: (2 * R + SW) * u, height: (2 * R + SW) * u, borderRadius: '50%', border: `${SW * u}px solid #fff`, boxSizing: 'border-box' }} />
              </div>
            </div>
          ))}
          {/* Halqalar */}
          {[['mbRing', 700, 0, '#FFC43D', 3], ['mbRing2', 900, 140, '#fff', 2]].map(([n, d, dl, c, bw]) => (
            <div key={n} className="mb-a" style={{ ...abs, left: sl, top: stp, width: S, height: S, borderRadius: '50%', border: `${bw}px solid ${c}`, boxSizing: 'border-box', ...A(n, d, FINAL + dl, 'cubic-bezier(.2,.7,.3,1)') }} />
          ))}
          {/* Uchqun: X (chiziqli) → Y (sakrash) → aylanish → siqilish */}
          <div className="mb-a" style={{ ...abs, left: sl, top: stp, width: S, height: S, ...A('mbX', STAR_DUR, STAR0) }}>
            <div className="mb-a" style={{ width: S, height: S, ...A('mbY', STAR_DUR, STAR0) }}>
              <div className="mb-a" style={{ width: S, height: S, ...A('mbR', STAR_DUR, STAR0, 'ease-in-out') }}>
                <div className="mb-a" style={{ width: S, height: S, transformOrigin: '50% 60%', ...A('mbQ', FX_DUR, STAR0) }}>
                  <img src={srcOf(STAR_IMG)} alt="" draggable={false} style={{ width: S, height: S, display: 'block' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yozuv */}
      <div className="mb-a" style={{ ...abs, left: 0, right: 0, top: logoTop + MH * u + 30, textAlign: 'center', ...A('mbWordOut', 480, EXIT) }}>
        <div style={{ fontFamily: 'Unbounded_700Bold, system-ui, sans-serif', fontSize: 30, color: '#fff', whiteSpace: 'pre' }}>
          {WORD.split('').map((ch, i) => (
            <span key={i} className="mb-a" style={{ display: 'inline-block', ...A('mbLetter', 520, FINAL + i * 45, BOUNCE) }}>{ch === ' ' ? ' ' : ch}</span>
          ))}
        </div>
        <div className="mb-a" style={{ color: '#fff', fontFamily: 'system-ui, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginTop: 8, ...A('mbSub', 420, FINAL + 420, 'ease-out') }}>{tr('IJODKORLAR BOZORI')}</div>
      </div>
    </div>
  );
}

let shown = false;
export function shouldShowIntro() {
  if (shown) return false;
  shown = true;
  try {
    if (typeof location !== 'undefined' && /[?&]intro\b/.test(location.search)) return true;
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('intro')) return false;
      sessionStorage.setItem('intro', '1');
    }
  } catch (e) {}
  return true;
}
