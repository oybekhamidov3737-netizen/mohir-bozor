import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

// Rasm tanlash: kichraytirilgan JPEG (base64) qaytaradi
export async function pickImages({ max = 1, width = 1280 } = {}) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted' && perm.accessPrivileges !== 'limited') {
    throw new Error("Galereyaga ruxsat berilmadi. Telefon sozlamalaridan ruxsat bering.");
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: max > 1,
    selectionLimit: max,
    quality: 1,
  });
  if (res.canceled) return [];
  const out = [];
  for (const a of res.assets.slice(0, max)) {
    const actions = a.width && a.width > width ? [{ resize: { width } }] : [];
    const r = await ImageManipulator.manipulateAsync(a.uri, actions, {
      compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true,
    });
    out.push({ uri: r.uri, base64: r.base64 });
  }
  return out;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64ToBytes(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i]), b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2]), d = B64.indexOf(clean[i + 3]);
    const n = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
    if (p < len) bytes[p++] = (n >> 16) & 255;
    if (c !== -1 && p < len) bytes[p++] = (n >> 8) & 255;
    if (d !== -1 && p < len) bytes[p++] = n & 255;
  }
  return bytes;
}

export async function uploadImage(bucket, path, img) {
  const { error } = await supabase.storage.from(bucket).upload(path, b64ToBytes(img.base64), {
    contentType: 'image/jpeg', upsert: false,
  });
  if (error) throw error;
  return path;
}

export const newName = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + '.jpg';
