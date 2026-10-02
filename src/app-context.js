import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Animated, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';
import { DEF_CFG } from './data';
import { isConfigured } from './config';
import { useT } from './theme';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const t = useT();
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(undefined); // undefined = yuklanmoqda, null = kabinet ochilmagan
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState(DEF_CFG);
  const [fav, setFav] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  const uid = session?.user?.id || null;

  useEffect(() => {
    if (!isConfigured()) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!uid) { setProfile(null); setIsAdmin(false); return null; }
    const [p, pp, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('profile_private').select('phone').eq('id', uid).maybeSingle(),
      supabase.rpc('is_admin'),
    ]);
    const prof = p.data ? { ...p.data, phone: pp.data?.phone || '' } : null;
    setProfile(prof);
    setIsAdmin(!!a.data);
    return prof;
  }, [uid]);
  useEffect(() => { setProfile(undefined); loadProfile(); }, [loadProfile]);

  const loadConfig = useCallback(async () => {
    if (!isConfigured()) return;
    const { data } = await supabase.from('config').select('*').eq('id', 1).maybeSingle();
    if (data) setConfig({ ...DEF_CFG, ...data, prices: { ...DEF_CFG.prices, ...(data.prices || {}) } });
  }, []);
  useEffect(() => { loadConfig(); }, [loadConfig]);

  // Saralanganlar (qurilmada saqlanadi)
  useEffect(() => { AsyncStorage.getItem('fav').then((v) => { try { setFav(JSON.parse(v) || []); } catch (e) {} }); }, []);
  const toggleFav = useCallback((id) => {
    setFav((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      AsyncStorage.setItem('fav', JSON.stringify(next));
      return next;
    });
  }, []);

  // O'qilmagan xabarlar soni
  const loadUnread = useCallback(async () => {
    if (!uid) { setUnread(0); return; }
    const { data } = await supabase.from('threads').select('buyer_id,seller_id,last_at,last_sender,buyer_read_at,seller_read_at')
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`);
    let n = 0;
    (data || []).forEach((th) => {
      const readAt = th.buyer_id === uid ? th.buyer_read_at : th.seller_read_at;
      if (th.last_sender && th.last_sender !== uid && th.last_at > readAt) n++;
    });
    setUnread(n);
  }, [uid]);
  useEffect(() => {
    loadUnread();
    if (!uid) return;
    const ch = supabase.channel('unread-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => loadUnread())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, loadUnread]);

  // Onlayn holati: ilova ochiq turganda har daqiqada belgilanadi
  useEffect(() => {
    if (!uid || !profile) return;
    const ping = () => { supabase.rpc('touch_seen').then(() => {}, () => {}); };
    ping();
    const iv = setInterval(() => {
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden) return;
      ping();
    }, 60000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') ping(); });
    return () => { clearInterval(iv); sub.remove(); };
  }, [uid, !!profile]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
    }, 2600);
  }, [toastAnim]);

  const value = {
    session, uid, ready, profile, isAdmin, config, fav, unread,
    loadProfile, loadConfig, loadUnread, toggleFav, toast,
    signOut: async () => { await supabase.auth.signOut(); setProfile(null); setIsAdmin(false); },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', left: 16, right: 16, bottom: 110, alignItems: 'center',
        opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}>
        {toastMsg ? (
          <View style={{ backgroundColor: t.ink, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, maxWidth: 520 }}>
            <Text style={{ color: t.bg, fontSize: 14, fontWeight: '600' }}>{toastMsg}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Ctx.Provider>
  );
}

// Kirish va kabinet talab qilinadigan amallar uchun
export function useRequire() {
  const { uid, profile } = useApp();
  const router = useRouter();
  return useCallback((next) => {
    if (!uid) { router.push({ pathname: '/login', params: { next } }); return false; }
    if (profile === null) { router.push({ pathname: '/profile', params: { next } }); return false; }
    if (profile === undefined) return false;
    return true;
  }, [uid, profile, router]);
}
