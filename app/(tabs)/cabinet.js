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
import { Avatar, Badge, Btn, Cover, Empty, H, Loading, Note, Seg } from '../../src/ui';

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
      <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>Kabinetingizni oching</Text>
      <Text style={{ color: t.muted, lineHeight: 20 }}>Bir daqiqada profil yarating va ijodkorlar bozoriga qo'shiling.</Text>
      {item('images-outline', "Rasmli e'lonlar joylash")}
      {item('chatbubbles-outline', 'Mijozlar bilan ilova ichida yozishish')}
      {item('rocket-outline', "TOP va VIP bilan ko'proq mijoz topish")}
      {item('shield-checkmark-outline', 'Email orqali tasdiqlangan ishonchli profil')}
      <Btn title="Kabinet ochish" onPress={onOpen} />
    </View>
  );
}

export default function Cabinet() {
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { uid, session, profile, isAdmin, config, loadProfile, signOut, toast } = useApp();
  const [ads, setAds] = useState(null);
  const [events, setEvents] = useState({});
  const [orders, setOrders] = useState([]);
  const [slots, setSlots] = useState(0);
  const [tab, setTab] = useState('live');
  const [canClaim, setCanClaim] = useState(false);
  const [sure, setSure] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const [a, o, s, ex] = await Promise.all([
      supabase.from('ads').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(30),
      supabase.from('user_slots').select('extra').eq('user_id', uid).maybeSingle(),
      supabase.rpc('admin_exists'),
    ]);
    const list = a.data || [];
    setAds(list); setOrders(o.data || []); setSlots(s.data?.extra || 0); setCanClaim(ex.data === false);
    if (list.length) {
      const { data: ev } = await supabase.from('ad_events').select('*').in('ad_id', list.map((x) => x.id)).order('created_at');
      const m = {}; (ev || []).forEach((e) => { (m[e.ad_id] = m[e.ad_id] || []).push(e); });
      setEvents(m);
    }
    setRefreshing(false);
  }, [uid]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirm = (key, fn) => { if (sure !== key) { setSure(key); setTimeout(() => setSure((s) => (s === key ? '' : s)), 3500); return; } setSure(''); fn(); };
  const del = (a) => confirm('del' + a.id, async () => {
    const { error } = await supabase.from('ads').update({ status: 'deleted' }).eq('id', a.id);
    if (error) toast(errText(error)); else { toast("E'lon arxivga o'tkazildi"); load(); }
  });
  const purge = (a) => confirm('purge' + a.id, async () => {
    if (a.photos?.length) await supabase.storage.from('ads').remove(a.photos);
    const { error } = await supabase.from('ads').delete().eq('id', a.id);
    if (error) toast(errText(error)); else { toast("E'lon butunlay o'chirildi"); load(); }
  });
  const claim = async () => {
    const { data, error } = await supabase.rpc('claim_first_admin');
    if (error || !data) toast('Admin allaqachon mavjud'); else { toast("Siz endi bozor egasisiz (admin)"); await loadProfile(); load(); }
  };
  const deleteAccount = () => confirm('acc', async () => {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) { toast(errText(error)); return; }
    await signOut(); toast("Hisobingiz o'chirildi");
  });

  const wrap = (children) => (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: ins.top + 12, paddingHorizontal: 16, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(); }} />}>
      {children}
    </ScrollView>
  );

  if (!session) return wrap(
    <>
      <Text style={{ fontFamily: FONT.displayM, fontSize: 20, color: t.ink }}>Kabinet</Text>
      <Onboard onOpen={() => router.push('/login')} />
      <Pressable onPress={() => router.push('/privacy')} style={{ marginTop: 18 }}><Text style={{ color: t.muted, textAlign: 'center' }}>Maxfiylik siyosati</Text></Pressable>
    </>
  );
  if (profile === undefined) return wrap(<Loading />);
  if (profile === null) return wrap(<Onboard onOpen={() => router.push('/profile')} />);

  const live = (ads || []).filter((a) => adState(a) === 'live');
  const grp = { live, expired: (ads || []).filter((a) => adState(a) === 'expired'), deleted: (ads || []).filter((a) => adState(a) === 'deleted') };
  const lim = isAdmin ? Infinity : config.free_ads + slots;
  const list = grp[tab];
  const loc = profile.region ? (profile.region === ONLINE ? 'Onlayn' : profile.district || shortReg(profile.region)) : '';

  const hist = (a) => {
    const p = [`Joylangan ${shortDate(a.created_at)}`];
    (events[a.id] || []).slice(-3).forEach((e) => p.push(`${EV[e.kind] || e.kind} ${shortDate(e.created_at)}`));
    const s = adState(a);
    if (s === 'deleted') p.push(`${a.mod_deleted ? "moderator o'chirgan" : "o'chirilgan"} ${shortDate(a.deleted_at)}`);
    else p.push(s === 'expired' ? `tugagan ${shortDate(a.expires_at)}` : `faol ${shortDate(a.expires_at)} gacha`);
    return p.join(' · ');
  };

  return wrap(
    <>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 18, padding: 14 }}>
        <Avatar profile={profile} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: t.ink }} numberOfLines={1}>{profile.name}</Text>
          <Text style={{ fontSize: 13, color: t.muted }} numberOfLines={1}>{[profile.cat ? catOf(profile.cat).n : 'Buyurtmachi', loc].filter(Boolean).join(' · ')}</Text>
          <Text style={{ fontSize: 12, color: t.muted }} numberOfLines={1}>✓ {session.user.email}</Text>
        </View>
        <Btn kind="sec" small title="Tahrirlash" onPress={() => router.push('/profile')} />
      </View>

      {isAdmin ? <Btn style={{ marginTop: 12 }} kind="gold" icon="speedometer-outline" title="Boshqaruv paneli (to'lovlar, e'lonlar, suhbatlar)" onPress={() => router.push('/admin')} /> : null}
      {canClaim ? (
        <View style={{ marginTop: 12 }}>
          <Note kind="gold">Bozorda hali admin yo'q. Agar siz bozor egasi bo'lsangiz, tugmani bosing. Bu faqat bir marta ishlaydi.</Note>
          <Btn kind="gold" title="Men bozor egasiman (admin bo'lish)" onPress={claim} />
        </View>
      ) : null}

      <H right={`${live.length} / ${lim === Infinity ? '∞' : lim} faol`}>Mening e'lonlarim</H>
      {lim !== Infinity ? (
        <View style={{ backgroundColor: t.chip, borderRadius: 12, padding: 12, gap: 8, marginBottom: 10 }}>
          <Text style={{ color: t.ink, fontSize: 13 }}>Bepul limit: {config.free_ads} ta faol e'lon{slots ? ` + ${slots} ta sotib olingan` : ''}. Har bir e'lon {config.ad_days} kun faol turadi.</Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.line, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (live.length / lim) * 100)}%`, height: 6, backgroundColor: t.accent }} />
          </View>
          {live.length >= lim - 1 ? <View style={{ alignSelf: 'flex-start' }}><Btn small kind="sec" title="Limitni oshirish" onPress={() => router.push('/promo/slots')} /></View> : null}
        </View>
      ) : null}

      <Seg value={tab} onChange={setTab} options={[['live', `Faol (${grp.live.length})`], ['expired', `Tugagan (${grp.expired.length})`], ['deleted', `Arxiv (${grp.deleted.length})`]]} />
      <View style={{ gap: 10, marginTop: 12 }}>
        {ads === null ? <Loading /> : list.length ? list.map((a) => {
          const img = adPhoto(a);
          const s = adState(a);
          return (
            <View key={a.id} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 10, gap: 10 }}>
              <Pressable onPress={() => router.push(`/ad/${a.id}`)} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', backgroundColor: t.chip }}>
                  {img ? <Image source={{ uri: img }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Cover cat={a.cat} />}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontWeight: '700', color: t.ink }} numberOfLines={1}>{a.title}</Text>
                  <Text style={{ color: t.price, fontWeight: '800' }}>{priceText(a)}</Text>
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                    {s === 'deleted' ? <Badge kind="no">{a.mod_deleted ? "MODERATOR O'CHIRGAN" : 'ARXIVDA'}</Badge>
                      : s === 'expired' ? <Badge kind="wait">MUDDATI TUGAGAN</Badge>
                        : isVip(a) ? <Badge kind="vip">VIP {shortDate(a.vip_until)} GACHA</Badge>
                          : isTop(a) ? <Badge kind="top">TOP {shortDate(a.top_until)} GACHA</Badge> : <Badge kind="ok">FAOL</Badge>}
                  </View>
                  <Text style={{ color: t.muted, fontSize: 11 }}>{hist(a)}</Text>
                </View>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {s === 'live' ? (
                  <>
                    <Btn small title="Reklama" icon="rocket-outline" onPress={() => router.push(`/promo/${a.id}`)} />
                    <Btn small kind="sec" title="Tahrirlash" onPress={() => router.push({ pathname: '/post', params: { id: a.id } })} />
                    <Btn small kind="dng" title={sure === 'del' + a.id ? "Ha, o'chirish" : "O'chirish"} onPress={() => del(a)} />
                  </>
                ) : s === 'expired' ? (
                  <>
                    <Btn small title={`Uzaytirish · ${fmtNum(config.prices.extend)} so'm`} onPress={() => router.push({ pathname: `/promo/${a.id}`, params: { svc: 'extend' } })} />
                    <Btn small kind="dng" title={sure === 'del' + a.id ? "Ha, o'chirish" : "O'chirish"} onPress={() => del(a)} />
                  </>
                ) : (
                  <>
                    {!a.mod_deleted ? <Btn small title={`Tiklash · ${fmtNum(config.prices.restore)} so'm`} onPress={() => router.push({ pathname: `/promo/${a.id}`, params: { svc: 'restore' } })} /> : null}
                    <Btn small kind="dng" title={sure === 'purge' + a.id ? 'Butunlay o\'chirilsinmi?' : "Butunlay o'chirish"} onPress={() => purge(a)} />
                  </>
                )}
              </View>
            </View>
          );
        }) : (
          <Empty title={tab === 'live' ? "Faol e'lonlar yo'q" : tab === 'expired' ? "Muddati tugagan e'lonlar yo'q" : "Arxiv bo'sh"}
            text={tab === 'live' ? "Xizmatingizni rasmlar bilan joylang yoki buyurtma e'lonini bering." : undefined}
            action={tab === 'live' ? "E'lon joylash" : undefined} onAction={() => router.push('/post')} />
        )}
      </View>

      {orders.length ? (
        <>
          <H right={`${orders.length} ta`}>To'lovlarim</H>
          <View style={{ gap: 8 }}>
            {orders.map((o) => (
              <View key={o.id} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800', color: t.ink }}>{o.code}</Text>
                  <Badge kind={o.status === 'ok' ? 'ok' : o.status === 'no' ? 'no' : 'wait'}>{o.status === 'ok' ? 'FAOLLASHTIRILDI' : o.status === 'no' ? 'RAD ETILDI' : 'TEKSHIRILMOQDA'}</Badge>
                </View>
                <Text style={{ color: t.muted, fontSize: 13 }}>{SVC[o.svc]} · {fmtNum(o.price)} so'm · {ago(o.created_at)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <H>Hisob</H>
      <View style={{ gap: 8 }}>
        <Btn kind="sec" icon="document-text-outline" title="Maxfiylik siyosati" onPress={() => router.push('/privacy')} />
        <Btn kind="sec" icon="log-out-outline" title="Chiqish" onPress={signOut} />
        <Btn kind="dng" icon="trash-outline" title={sure === 'acc' ? "Ha, hisobim va e'lonlarim o'chirilsin" : "Hisobni o'chirish"} onPress={deleteAccount} />
      </View>
      <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center', marginTop: 14 }}>{since(profile.created_at)}</Text>
    </>
  );
}
