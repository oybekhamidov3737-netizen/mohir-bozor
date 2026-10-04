import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase, adPhoto, errText } from '../../src/supabase';
import { CATS, ONLINE, SVC, catOf } from '../../src/data';
import { adState, ago, fmtNum, isTop, isVip, priceText, shortDate, shortReg, since } from '../../src/format';
import { Avatar, Badge, Btn, Cover, Empty, H, Loading, MenuGroup, Note, Press, Seg } from '../../src/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { InviteCard } from '../../src/invite';
import { BalanceCard } from '../../src/balance';
import { AppearanceCard } from '../../src/appearance';
import { PAYMENTS_IN_APP } from '../../src/pay';
import { BUILD_ID } from '../../src/updater';
import { copyText } from '../../src/copy';
import { MfaChallenge, MfaSetup, useMfaNeeded } from '../../src/mfa';
import { tr } from '../../src/i18n';

const EV = { top: 'TOP', vip: 'VIP', bump: "ko'tarildi", extend: 'uzaytirildi', restore: 'tiklandi', moderator: "moderator o'chirdi" };

function Onboard({ onOpen }) {
  const t = useT();
  const item = (icon, text) => (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={18} color={t.accent} /></View>
      <Text style={{ color: t.ink, fontSize: 14, flex: 1 }}>{text}</Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 22, padding: 22, gap: 14, marginTop: 16 }}>
      <View style={{ width: 84, height: 84, borderRadius: 26, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-add-outline" size={38} color={t.accent} /></View>
      <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{tr("Kabinetingizni oching")}</Text>
      <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Bir daqiqada profil yarating va ijodkorlar bozoriga qo'shiling.")}</Text>
      {item('images-outline', tr("Rasmli e'lonlar joylash"))}
      {item('chatbubbles-outline', tr("Mijozlar bilan ilova ichida yozishish"))}
      {item('rocket-outline', tr("TOP va VIP bilan ko'proq mijoz topish"))}
      {item('shield-checkmark-outline', tr("Email orqali tasdiqlangan ishonchli profil"))}
      <Btn title={tr("Kabinet ochish")} onPress={onOpen} />
    </View>
  );
}

export default function Cabinet() {
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { uid, session, profile, isAdmin, config, loadProfile, toast } = useApp();
  const [c, setC] = useState({ live: 0, done: 0, unpaid: 0, offers: 0, apps: 0, bal: null });
  const [canClaim, setCanClaim] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mfaNeed, recheckMfa] = useMfaNeeded();

  const load = useCallback(async () => {
    if (!uid) return;
    const now = new Date().toISOString();
    const head = { count: 'exact', head: true };
    const [lv, all, up, of, ap, w, ex] = await Promise.all([
      supabase.from('ads').select('id', head).eq('user_id', uid).eq('status', 'active').gt('expires_at', now),
      supabase.from('ads').select('id', head).eq('user_id', uid),
      supabase.from('orders').select('id', head).eq('user_id', uid).in('status', ['unpaid', 'pending']),
      supabase.from('threads').select('id, ads!inner(kind)', head).eq('seller_id', uid).eq('ads.kind', 'buyurtma'),
      supabase.from('threads').select('id, ads!inner(kind)', head).eq('buyer_id', uid).eq('ads.kind', 'buyurtma'),
      PAYMENTS_IN_APP ? supabase.from('wallets').select('balance,bonus').eq('user_id', uid).maybeSingle() : Promise.resolve({ data: null }),
      supabase.rpc('admin_exists'),
    ]);
    setC({ live: lv.count || 0, done: Math.max(0, (all.count || 0) - (lv.count || 0)), unpaid: up.count || 0, offers: of.count || 0, apps: ap.count || 0, bal: w.data });
    setCanClaim(ex.data === false);
    setRefreshing(false);
  }, [uid]);
  useFocusEffect(useCallback(() => { load(); loadProfile(); }, [load]));

  const claim = async () => {
    const { data, error } = await supabase.rpc('claim_first_admin');
    if (error || !data) toast(tr("Admin allaqachon mavjud")); else { toast(tr("Siz endi bozor egasisiz (admin)")); await loadProfile(); load(); }
  };
  const openInbox = async () => {
    if (isAdmin) { router.push('/chats'); return; }
    const { data, error } = await supabase.rpc('start_support_thread');
    if (error) toast(errText(error)); else router.push(`/chat/${data}`);
  };

  const wrap = (children) => (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: ins.top + 12, paddingHorizontal: 16, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(); }} />}>
      {children}
    </ScrollView>
  );

  const others = (
    <>
      <H>{tr("Boshqa")}</H>
      <MenuGroup items={[
        { icon: 'settings', title: tr("Sozlamalar"), sub: tr("Til, ko'rinish, hisob"), color: '#5C6862', onPress: () => router.push('/settings') },
        { icon: 'help-buoy', title: tr("Yordam"), sub: config.support_phone || '+998 91 001 88 18', color: '#0C9A6A', onPress: () => router.push('/support') },
        { icon: 'chatbubble-ellipses', title: tr("Teskari aloqa"), color: '#F08A00', onPress: () => router.push('/feedback') },
        { icon: 'information-circle', title: tr("Ilova haqida"), sub: tr("Shartlar, maxfiylik, aloqa"), color: '#2747D6', onPress: () => router.push('/about') },
      ]} />
      <Text style={{ color: t.muted, fontSize: 11, textAlign: 'center', marginTop: 14, opacity: 0.7 }}>{tr("Versiya")}{' '}{BUILD_ID || '—'}</Text>
    </>
  );

  if (!session) return wrap(
    <>
      <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{tr("Kabinet")}</Text>
      <Onboard onOpen={() => router.push('/login')} />
      {others}
    </>
  );
  if (profile === undefined) return wrap(<Loading />);
  if (profile === null) return wrap(<><Onboard onOpen={() => router.push('/profile')} />{others}</>);

  const bal = c.bal ? Number(c.bal.balance || 0) : 0;
  const bon = c.bal ? Number(c.bal.bonus || 0) : 0;
  const loc = profile.region ? (profile.region === ONLINE ? tr('Onlayn') : profile.district || shortReg(profile.region)) : '';
  const tile = (colors, icon, title, sub, onPress, badge) => (
    <Press key={title} onPress={onPress} style={{ width: '48.5%' }}>
      <View style={{ backgroundColor: t.surface, borderRadius: 22, padding: 14, gap: 10, minHeight: 118 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={22} color="#fff" />
          </LinearGradient>
          {badge ? <View style={{ minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 7, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.accent, fontWeight: '900', fontSize: 13 }}>{badge}</Text></View> : null}
        </View>
        <View>
          <Text style={{ color: t.ink, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{title}</Text>
          <Text style={{ color: t.muted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>{sub}</Text>
        </View>
      </View>
    </Press>
  );

  return wrap(
    <>
      {/* Sarlavha: o'zimizning gradient karta */}
      <LinearGradient colors={['#4A6CFF', '#2747D6', '#1631B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 18, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: -30, bottom: -70, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,196,61,0.18)' }} />
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Pressable onPress={() => router.push(`/u/${uid}`)} style={{ padding: 3, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.35)' }}><Avatar profile={profile} size={66} /></Pressable>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 19, color: '#fff' }} numberOfLines={1}>{profile.name}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>{[profile.cat ? catOf(profile.cat).n : tr('Buyurtmachi'), loc].filter(Boolean).join(' · ')}</Text>
            <Pressable onPress={() => { copyText(String(profile.public_id)); toast(tr("ID nusxalandi: ") + profile.public_id); }} accessibilityLabel={tr("ID ni nusxalash")}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginTop: 2 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>ID {profile.public_id}</Text>
              <Ionicons name="copy-outline" size={12} color="#fff" />
            </Pressable>
          </View>
          <Press onPress={() => router.push('/profile')} accessibilityLabel={tr("Profilni tahrirlash")} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </Press>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: 18, paddingVertical: 10 }}>
          {[
            [String(c.live), tr('faol'), () => router.push({ pathname: '/my-ads', params: { tab: 'live' } })],
            [String(c.done), tr('tugagan'), () => router.push({ pathname: '/my-ads', params: { tab: 'done' } })],
            [profile.rating_count ? '★ ' + Number(profile.rating).toFixed(1) : '—', profile.rating_count ? tr('{0} ta baho', profile.rating_count) : tr('baho yo\'q'), () => router.push({ pathname: `/u/${uid}`, params: { tab: 'reviews' } })],
          ].map(([v, l, go], i) => (
            <Pressable key={i} onPress={go} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 18, color: i === 2 && profile.rating_count ? '#FFC43D' : '#fff' }}>{v}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '600' }}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {PAYMENTS_IN_APP ? (
        <View style={{ marginTop: 12, backgroundColor: t.surface, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LinearGradient colors={['#34DBA5', '#0C9A6A']} style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="wallet" size={22} color="#fff" /></LinearGradient>
          <Pressable onPress={() => router.push('/wallet')} style={{ flex: 1 }}>
            <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>{tr('Balans')}</Text>
            <Text style={{ color: t.ink, fontFamily: FONT.display, fontSize: 18 }}>{fmtNum(bal + bon)} {tr("so'm")}</Text>
            {bon ? <Text style={{ color: t.muted, fontSize: 11.5 }}>{tr('shundan bonus: {0}', fmtNum(bon))}</Text> : null}
          </Pressable>
          <Btn small title={tr("To'ldirish")} icon="add" onPress={() => router.push('/topup')} />
        </View>
      ) : null}

      {c.unpaid ? (
        <Pressable onPress={() => router.push({ pathname: '/my-ads', params: { tab: 'unpaid' } })} style={{ marginTop: 12, backgroundColor: t.goldSoft, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="time" size={20} color={t.gold} />
          <Text style={{ color: t.ink, flex: 1, fontWeight: '600' }}>{tr("{0} ta xizmat to'lov kutmoqda", c.unpaid)}</Text>
          <Ionicons name="chevron-forward" size={18} color={t.gold} />
        </Pressable>
      ) : null}

      <Press onPress={() => router.push('/post')} style={{ marginTop: 12 }}>
        <LinearGradient colors={['#FFB347', '#FF5E8A', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={{ fontFamily: FONT.display, fontSize: 17, color: '#fff' }}>{tr("E'lon joylash")}</Text>
        </LinearGradient>
      </Press>

      {mfaNeed ? <MfaChallenge onDone={recheckMfa} /> : null}
      {isAdmin ? <Btn style={{ marginTop: 12 }} kind="gold" icon="speedometer-outline" title={tr("Boshqaruv paneli (to'lovlar, e'lonlar, suhbatlar)")} onPress={() => router.push('/admin')} /> : null}
      {isAdmin ? <MfaSetup /> : null}
      {canClaim ? (
        <View style={{ marginTop: 12 }}>
          <Note kind="gold">{tr("Bozorda hali admin yo'q. Agar siz bozor egasi bo'lsangiz, tugmani bosing. Bu faqat bir marta ishlaydi.")}</Note>
          <Btn kind="gold" title={tr("Men bozor egasiman (admin bo'lish)")} onPress={claim} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 16 }}>
        {tile(['#6A8BFF', '#2D46E0'], 'albums', tr("E'lonlarim"), tr('Faol, tugagan va arxiv'), () => router.push('/my-ads'), c.live || null)}
        {tile(['#AE8CFF', '#6A3FE0'], 'mail-open', tr('Takliflar'), tr('Buyurtmalaringizga yozganlar'), () => router.push({ pathname: '/offers', params: { mode: 'offers' } }), c.offers || null)}
        {tile(['#34DBA5', '#0C9A6A'], 'sparkles', tr('Siz uchun'), tr("Yo'nalishingizga mos buyurtmalar"), () => router.push('/jobs'))}
        {tile(['#FFA155', '#F0532E'], 'paper-plane', tr('Murojaatlarim'), tr('Siz yozgan buyurtmalar'), () => router.push({ pathname: '/offers', params: { mode: 'applications' } }), c.apps || null)}
      </View>

      <H>{tr('Ijodkor sifatida')}</H>
      <MenuGroup items={[
        { icon: 'person-circle', title: tr("Ochiq profilim"), sub: tr("Mijozlar ko'radigan sahifa: e'lonlar va baholar"), color: '#2747D6', onPress: () => router.push(`/u/${uid}`) },
        { icon: 'options', title: tr("Istagan ishim"), sub: profile.pref_cats?.length ? tr("{0} ta yo'nalish tanlangan", profile.pref_cats.length) : tr("Yo'nalish va hududni tanlang"), color: '#6A3FE0', onPress: () => router.push('/prefs') },
        PAYMENTS_IN_APP ? { icon: 'receipt', title: tr("To'lovlar tarixi"), sub: tr("TOP, VIP, ko'tarish va to'ldirishlar"), color: '#D8246C', onPress: () => router.push('/orders') } : null,
      ]} />

      {others}
      <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>{since(profile.created_at)}</Text>
    </>
  );
}
