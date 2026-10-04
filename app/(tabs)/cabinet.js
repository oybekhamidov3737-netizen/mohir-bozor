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
      <H>{tr("Sozlamalar va boshqalar")}</H>
      <MenuGroup items={[
        { icon: 'settings', title: tr("Sozlamalar"), sub: tr("Til, ko'rinish, hisob"), color: '#5C6862', onPress: () => router.push('/settings') },
        { icon: 'help-buoy', title: tr("Yordam"), sub: config.support_phone || '+998 91 001 88 18', color: '#0C9A6A', onPress: () => router.push('/support') },
        { icon: 'chatbubble-ellipses', title: tr("Teskari aloqa"), color: '#F08A00', onPress: () => router.push('/feedback') },
        { icon: 'reader', title: tr("Shartlar va qoidalar"), color: '#6A3FE0', onPress: () => router.push('/terms') },
        { icon: 'lock-closed', title: tr("Maxfiylik siyosati"), color: '#2747D6', onPress: () => router.push('/privacy') },
        PAYMENTS_IN_APP ? { icon: 'receipt', title: tr("Ommaviy oferta"), color: '#D8246C', onPress: () => router.push('/offer') } : null,
        { icon: 'information-circle', title: tr("Ilova haqida"), color: '#0C6E9A', onPress: () => router.push('/about') },
      ]} />
      <Text style={{ color: t.muted, fontSize: 11, textAlign: 'center', marginTop: 14, opacity: 0.7 }}>{tr("Versiya")}{' '}{BUILD_ID || '—'}</Text>
    </>
  );

  if (!session) return wrap(
    <>
      <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{tr("Profilim")}</Text>
      <Onboard onOpen={() => router.push('/login')} />
      {others}
    </>
  );
  if (profile === undefined) return wrap(<Loading />);
  if (profile === null) return wrap(<><Onboard onOpen={() => router.push('/profile')} />{others}</>);

  const first = String(profile.name || '').split(' ')[0];
  const bal = c.bal ? Number(c.bal.balance || 0) : 0;
  const bon = c.bal ? Number(c.bal.bonus || 0) : 0;
  const paid = PAYMENTS_IN_APP || isAdmin;
  const cta = (colors, icon, title, onPress, tint) => (
    <Press onPress={onPress} style={{ marginTop: 10 }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 64, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: -18, top: -18, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.25)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: -14, bottom: -24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.18)' }} />
        <Ionicons name={icon} size={24} color={tint} />
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: tint }}>{title}</Text>
      </LinearGradient>
    </Press>
  );
  const count = (n) => (n ? String(n) : undefined);

  return wrap(
    <>
      <LinearGradient colors={t.dark ? ['#1B2140', '#121733'] : ['#4A6CFF', '#2747D6', '#1631B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(52,219,165,0.35)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ padding: 3, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.35)' }}><Avatar profile={profile} size={80} /></View>
          <Press onPress={() => router.push('/profile')} accessibilityLabel={tr("Profilni tahrirlash")} style={{ paddingHorizontal: 14, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.25)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5, letterSpacing: 0.5 }}>{tr("TAHRIRLASH")}</Text>
          </Press>
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 26, color: '#fff', marginTop: 12 }} numberOfLines={1}>{tr("Salom, {0}!", first)}</Text>
        <Pressable onPress={() => { copyText(String(profile.public_id)); toast(tr("ID nusxalandi: ") + profile.public_id); }} accessibilityLabel={tr("ID ni nusxalash")} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' }}>ID: {profile.public_id}</Text>
          <Ionicons name="copy-outline" size={12} color="rgba(255,255,255,0.75)" />
        </Pressable>
        {profile.rating_count ? <Text style={{ color: '#FFC43D', fontWeight: '800', marginTop: 4 }}>★ {Number(profile.rating).toFixed(1)} <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>· {tr('{0} ta baho', profile.rating_count)}</Text></Text> : null}
        {PAYMENTS_IN_APP ? (
          <Pressable onPress={() => router.push('/wallet')} style={{ marginTop: 12, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="wallet" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>{tr("Hamyoningizda:")} <Text style={{ fontWeight: '900' }}>{fmtNum(bal)} {tr("so'm")}</Text></Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12.5 }}>{tr("Bonuslar:")} {fmtNum(bon)} {tr("so'm")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        ) : null}
      </LinearGradient>

      {cta(['#FFF59D', '#FFE066'], 'add-circle', tr("E'lon joylashtirish"), () => router.push('/post'), '#3A2E00')}
      {paid ? cta(['#B9F6E4', '#7FE7CC'], 'albums', tr("To'plam sotib olish"), () => router.push('/promo/slots'), '#0B3B2E') : null}

      {mfaNeed ? <MfaChallenge onDone={recheckMfa} /> : null}
      {isAdmin ? <Btn style={{ marginTop: 12 }} kind="gold" icon="speedometer-outline" title={tr("Boshqaruv paneli (to'lovlar, e'lonlar, suhbatlar)")} onPress={() => router.push('/admin')} /> : null}
      {isAdmin ? <MfaSetup /> : null}
      {canClaim ? (
        <View style={{ marginTop: 12 }}>
          <Note kind="gold">{tr("Bozorda hali admin yo'q. Agar siz bozor egasi bo'lsangiz, tugmani bosing. Bu faqat bir marta ishlaydi.")}</Note>
          <Btn kind="gold" title={tr("Men bozor egasiman (admin bo'lish)")} onPress={claim} />
        </View>
      ) : null}

      <H>{tr("Sizning e'lonlaringiz")}</H>
      <MenuGroup items={[
        { icon: 'megaphone', title: tr("Faol e'lonlar"), right: count(c.live), color: '#2747D6', onPress: () => router.push({ pathname: '/my-ads', params: { tab: 'live' } }) },
        paid || c.unpaid ? { icon: 'card', title: tr("To'lanmagan"), sub: tr("Faollashtirish uchun xizmat narxini to'lang"), right: count(c.unpaid), color: '#F08A00', onPress: () => router.push({ pathname: '/my-ads', params: { tab: 'unpaid' } }) } : null,
        { icon: 'archive', title: tr("Yakunlangan e'lonlar"), right: count(c.done), color: '#5C6862', onPress: () => router.push({ pathname: '/my-ads', params: { tab: 'done' } }) },
      ]} />

      <H>{tr("Buyurtmachi paneli")}</H>
      <MenuGroup items={[
        { icon: 'mail-open', title: tr("Takliflar ro'yxati"), sub: tr("Buyurtmalaringizga yozgan ijodkorlar"), right: count(c.offers), color: '#6A3FE0', onPress: () => router.push({ pathname: '/offers', params: { mode: 'offers' } }) },
      ]} />

      <H>{tr("Chat")}</H>
      <MenuGroup items={[
        { icon: 'chatbubbles', title: tr("Aktiv suhbatlar"), color: '#0C9A6A', onPress: () => router.push('/chats') },
        { icon: 'file-tray-full', title: tr("Quti"), sub: tr("Mohir bozor jamoasidan xabarlar"), color: '#0C6E9A', onPress: openInbox },
      ]} />

      {paid ? (
        <>
          <H>{tr("To'lovlar")}</H>
          <MenuGroup items={[
            { icon: 'wallet', title: tr("Mohir hisob"), sub: tr("Balans, to'ldirish va bonuslar"), color: '#2747D6', onPress: () => router.push('/wallet') },
            { icon: 'time', title: tr("To'lovlar tarixi"), color: '#5C6862', onPress: () => router.push('/orders') },
          ]} />
        </>
      ) : null}

      <H>{tr("Reyting")}</H>
      <MenuGroup items={[
        { icon: 'star', title: tr("Olingan baholar"), right: profile.rating_count ? '★ ' + Number(profile.rating).toFixed(1) + ' (' + profile.rating_count + ')' : undefined, color: '#F5A623', onPress: () => router.push({ pathname: `/u/${uid}`, params: { tab: 'reviews' } }) },
      ]} />

      {paid ? (
        <>
          <H>{tr("Mening biznesim")}</H>
          <MenuGroup items={[
            { icon: 'bag-check', title: tr("Sotib olingan to'plamlar"), sub: tr("TOP, VIP, ko'tarish va qo'shimcha joylar"), color: '#D8246C', onPress: () => router.push({ pathname: '/orders', params: { filter: 'packages' } }) },
          ]} />
        </>
      ) : null}

      <H>{tr("Ijodkor profili")}</H>
      <MenuGroup items={[
        { icon: 'sparkles', title: tr("Siz uchun buyurtmalar"), sub: tr("Yo'nalishingizga mos mijoz buyurtmalari"), color: '#0C9A6A', onPress: () => router.push('/jobs') },
        { icon: 'person-circle', title: tr("Ijodkor profilim"), sub: tr("Mijozlar ko'radigan ochiq sahifa"), color: '#2747D6', onPress: () => router.push(`/u/${uid}`) },
        { icon: 'options', title: tr("Istagan ishim"), sub: profile.pref_cats?.length ? tr("{0} ta yo'nalish tanlangan", profile.pref_cats.length) : tr("Yo'nalish va hududni tanlang"), color: '#6A3FE0', onPress: () => router.push('/prefs') },
        { icon: 'paper-plane', title: tr("Mening murojaatlarim"), sub: tr("Siz yozgan buyurtmalar"), right: count(c.apps), color: '#F08A00', onPress: () => router.push({ pathname: '/offers', params: { mode: 'applications' } }) },
      ]} />

      {others}
      <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>{since(profile.created_at)}</Text>
    </>
  );
}
