// Hajmli (3D) belgilar — Microsoft Fluent Emoji 3D (MIT litsenziyasi, assets/3d/LICENSE).
// Har biri ~5 KB WebP; faqat ko'rinadigan ekranda yuklanadi.
import React from 'react';
import { Image } from 'expo-image';

export const I3D = {
  bell: require('../assets/3d/bell.webp'),
  briefcase: require('../assets/3d/briefcase.webp'),
  bulb: require('../assets/3d/bulb.webp'),
  camera: require('../assets/3d/camera.webp'),
  chart: require('../assets/3d/chart.webp'),
  chat: require('../assets/3d/chat.webp'),
  check: require('../assets/3d/check.webp'),
  clapper: require('../assets/3d/clapper.webp'),
  crown: require('../assets/3d/crown.webp'),
  film: require('../assets/3d/film.webp'),
  fire: require('../assets/3d/fire.webp'),
  gem: require('../assets/3d/gem.webp'),
  gift: require('../assets/3d/gift.webp'),
  handshake: require('../assets/3d/handshake.webp'),
  heart: require('../assets/3d/heart.webp'),
  laptop: require('../assets/3d/laptop.webp'),
  map: require('../assets/3d/map.webp'),
  megaphone: require('../assets/3d/megaphone.webp'),
  memo: require('../assets/3d/memo.webp'),
  mic: require('../assets/3d/mic.webp'),
  money: require('../assets/3d/money.webp'),
  palette: require('../assets/3d/palette.webp'),
  party: require('../assets/3d/party.webp'),
  phone: require('../assets/3d/phone.webp'),
  picture: require('../assets/3d/picture.webp'),
  pin: require('../assets/3d/pin.webp'),
  rocket: require('../assets/3d/rocket.webp'),
  search: require('../assets/3d/search.webp'),
  shield: require('../assets/3d/shield.webp'),
  sparkles: require('../assets/3d/sparkles.webp'),
  star: require('../assets/3d/star.webp'),
  target: require('../assets/3d/target.webp'),
  trophy: require('../assets/3d/trophy.webp'),
  videocam: require('../assets/3d/videocam.webp'),
  wave: require('../assets/3d/wave.webp'),
};

// Kategoriya → 3D belgi
export const CAT3D = {
  smm: 'phone', montaj: 'clapper', mobilo: 'videocam', target: 'target', dizayn: 'palette', motion: 'film',
  kopi: 'memo', foto: 'camera', strat: 'chart', sayt: 'laptop', ovoz: 'mic', bloger: 'star',
};

// Oddiy (Ionicons) belgi nomi → mos 3D belgi (bo'sh holatlar uchun)
export const ION3D = {
  sparkles: 'sparkles', search: 'search', megaphone: 'megaphone', heart: 'heart', chatbubbles: 'chat',
  albums: 'picture', 'person-circle': 'wave', 'notifications': 'bell', rocket: 'rocket', gift: 'gift',
};

export function Icon3D({ name, size = 40, style }) {
  const src = I3D[name];
  if (!src) return null;
  return <Image source={src} style={[{ width: size, height: size }, style]} contentFit="contain" cachePolicy="memory-disk" transition={120} />;
}
