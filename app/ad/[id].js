import React, { useEffect, useState } from 'react';
import { ListPicker } from '../../src/pickers';
import { Linking, Platform, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../../src/theme';
import { PAYMENTS_IN_APP } from '../../src/pay';
import { useApp, useRequire } from '../../src/app-context';
import { supabase, publicUrl, errText } from '../../src/supabase';
import { catOf, GRAD } from '../../src/data';
import { LinearGradient } from 'expo-linear-gradient';
import { ago, adState, isTop, isVip, locLabel, priceText, since, seenText, isOnline } from '../../src/format';
import { fetchFeed } from '../../src/api';
import { WEB_URL } from '../../src/config';
import { AdCard, Avatar, Badge, Btn, Cover, Empty, H, Loading, Note, Press } from '../../src/ui';

export default function AdPage() {
  const { id } = useLocalSearchParams();
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const need = useRequire();
  const { uid, isAdmin, fav, toggleFav, toast } = useApp();
  const { width } = useWindowDimensions();
  const W = Math.min(width, 760);
  const [ad, setAd] = useState(undefined);
  const [seller, setSeller] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [page, setPage] = useState(0);
  const [phone, setPhone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [more, setMore] = useState(false);
  const REASONS = [['fraud', 'Firibgarlik'], ['offtopic', 'Mavzuga aloqasi yo\'q'], ['contact', 'Tashqi kontakt (Telegram va h.k.)'], ['spam', 'Spam yoki takror e\'lon'], ['offensive', 'Haqoratli matn yoki rasm'], ['other', 'Boshqa sabab']];
  const sendReport = async (reason) => {
    if (!need(`/ad/${id}`)) return;
    const { error } = await supabase.from('reports').insert({ ad_id: id, reason });
    if (error && /duplicate|unique/i.test(error.message)) { toast("Siz bu e'longa allaqachon shikoyat qilgansiz"); return; }
    if (error) { toast(errText(error)); return; }
    toast('Shikoyat yuborildi. Rahmat, tez orada tekshiramiz.');
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from('ads').select('*').eq('id', id).maybeSingle();
      if (!alive) return;
      setAd(data || null);
      if (data) {
        const [{ data: p }, sim] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', data.user_id).maybeSingle(),
          fetchFeed({ cat: data.cat, exclude: data.id, limit: 8 }).catch(() => []),
        ]);
        if (!alive) return;
        setSeller(p); setSimilar(sim);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (ad === undefined) return <View style={{ flex: 1, backgroundColor: t.bg }}><Loading /></View>;
  if (!ad) return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      <Empty title="E'lon topilmadi" text="E'lon o'chirilgan yoki muddati tugagan bo'lishi mumkin." action="Bosh sahifa" onAction={() => router.replace('/')} />
    </View>
  );

  const mine = uid && ad.user_id === uid;
  const st = adState(ad);
  const photos = (ad.photos || []).map((p) => publicUrl('ads', p));
  const isFav = fav.includes(ad.id);

  const write = async () => {
    if (!need(`/ad/${ad.id}`)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('start_thread', { p_ad: ad.id });
    setBusy(false);
    if (error) { toast(errText(error)); return; }
    router.push(`/chat/${data}`);
  };
  const share = async () => {
    const url = `${WEB_URL}/ad/${ad.id}`;
    try { await Share.share(Platform.OS === 'ios' ? { message: ad.title, url } : { message: `${ad.title}\n${url}` }); } catch (e) {}
  };
  const modDelete = async () => {
    if (!sure) { setSure(true); return; }
    const { error } = await supabase.rpc('admin_delete_ad', { p_ad: ad.id });
    if (error) toast(errText(error)); else { toast("E'lon olib tashlandi"); router.back(); }
  };

  const isLong = (ad.description || '').length > 260;
  const tile = (icon, k, v, i) => (
    <View key={k} style={{ width: '48.5%', flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: t.bg, borderRadius: 16, padding: 10 }}>
      <LinearGradient colors={GRAD[i % GRAD.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: t.muted, fontWeight: '600' }}>{k}</Text>
        <Text style={{ fontSize: 13.5, color: t.ink, fontWeight: '700' }} numberOfLines={2}>{v}</Text>
      </View>
    </View>
  );
  const roundBtn = (icon, onPress, label, color) => (
    <Press onPress={onPress} accessibilityLabel={label} haptic={false} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={21} color={color || '#141D19'} />
    </Press>
  );
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  const imgH = Math.min(W * 0.92, 520);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false, title: ad.title }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 130, maxWidth: 760, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
        {/* Rasm galereyasi */}
        <View style={{ width: W, height: imgH, backgroundColor: '#0d0f0e', overflow: 'hidden' }}>
          {photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
              onScroll={Platform.OS === 'web' ? (e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W)) : undefined} scrollEventThrottle={64}>
              {photos.map((u) => <Image key={u} source={{ uri: u }} style={{ width: W, height: imgH }} contentFit="cover" transition={250} />)}
            </ScrollView>
          ) : <Cover cat={ad.cat} big style={{ paddingBottom: 46 }} />}
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.35)', 'transparent']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 110 }} />
          <View style={{ position: 'absolute', left: 14, right: 14, top: ins.top + 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            {roundBtn('chevron-back', back, 'Orqaga')}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {roundBtn('share-social-outline', share, 'Ulashish')}
              {roundBtn(isFav ? 'heart' : 'heart-outline', () => toggleFav(ad.id), 'Saralash', isFav ? '#E5484D' : undefined)}
            </View>
          </View>
          {photos.length > 1 ? (
            <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
              {photos.map((u, i) => <View key={u} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
            </View>
          ) : null}
        </View>

        {/* Asosiy kartochka rasm ustiga chiqib turadi */}
        <View style={{ marginTop: -26, backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {isVip(ad) ? <Badge kind="vip">★ VIP</Badge> : isTop(ad) ? <Badge kind="top">TOP</Badge> : null}
            {ad.kind === 'buyurtma' ? <Badge kind="req">BUYURTMA</Badge> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accentSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
              <Ionicons name={catOf(ad.cat).icon} size={12} color={t.accent} />
              <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>{catOf(ad.cat).n}</Text>
            </View>
            <Text style={{ color: t.muted, fontSize: 12 }}>· {ago(ad.created_at)}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: t.ink, lineHeight: 28 }}>{ad.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.price }}>{priceText(ad)}</Text>
            {ad.negotiable && +ad.price ? <View style={{ backgroundColor: t.goldSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}><Text style={{ color: t.gold, fontSize: 12, fontWeight: '800' }}>Kelishiladi</Text></View> : null}
          </View>
          {st !== 'live' ? <Note kind="gold">{st === 'expired' ? "Bu e'lonning muddati tugagan, u qidiruvda ko'rinmaydi." : "Bu e'lon arxivda."}</Note> : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 4 }}>
            {tile('briefcase', 'Turi', ad.kind === 'buyurtma' ? 'Buyurtma' : 'Xizmat taklifi', 0)}
            {tile('location', 'Hudud', locLabel(ad), 2)}
            {tile('ribbon', 'Tajriba', ad.exp_years ? ad.exp_years + ' yil' : "Ko'rsatilmagan", 4)}
            {tile('time', 'Joylangan', ago(ad.created_at), 1)}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <View style={{ backgroundColor: t.surface, borderRadius: 22, padding: 16, marginTop: 10, gap: 8 }}>
            <Text style={{ fontFamily: FONT.displayM, fontSize: 17, color: t.ink }}>Tavsif</Text>
            <Text selectable style={{ color: t.ink, fontSize: 15, lineHeight: 23 }} numberOfLines={isLong && !more ? 7 : undefined}>{ad.description}</Text>
            {isLong ? <Pressable onPress={() => setMore(!more)}><Text style={{ color: t.accent, fontWeight: '800' }}>{more ? 'Yigʻish' : "To'liq o'qish"}</Text></Pressable> : null}
          </View>

          <View style={{ backgroundColor: t.surface, borderRadius: 22, padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: FONT.displayM, fontSize: 17, color: t.ink }}>{ad.kind === 'buyurtma' ? 'Buyurtmachi' : 'Ijrochi'}</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View>
                <LinearGradient colors={['#FFC43D', '#FF77AE', '#6A8BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 2.5, borderRadius: 20 }}>
                  <View style={{ backgroundColor: t.surface, padding: 2, borderRadius: 18 }}><Avatar profile={seller} name={ad.seller_name} size={52} /></View>
                </LinearGradient>
                {isOnline(seller?.last_seen) ? <View style={{ position: 'absolute', right: -1, bottom: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: t.surface }} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontWeight: '800', color: t.ink, fontSize: 16 }} numberOfLines={1}>{seller?.name || ad.seller_name}</Text>
                {seller?.last_seen ? <Text style={{ color: isOnline(seller.last_seen) ? t.price : t.muted, fontSize: 12.5, fontWeight: '600' }}>{seenText(seller.last_seen)}</Text> : null}
                {seller ? <Text style={{ color: t.muted, fontSize: 12 }}>{since(seller.created_at)}</Text> : null}
              </View>
            </View>
            {seller?.bio ? <Text style={{ color: t.muted, fontSize: 13.5, lineHeight: 19 }} numberOfLines={4}>{seller.bio}</Text> : null}
          </View>

          <LinearGradient colors={t.dark ? ['#13261F', '#0F1E19'] : ['#E7F8EF', '#F3FBF7']} style={{ borderRadius: 22, padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color={t.price} />
              <Text style={{ fontWeight: '800', color: t.ink, fontSize: 15 }}>Xavfsiz kelishuv</Text>
            </View>
            {['Faqat ilova ichidagi chatda yozishing — yozishma saqlanadi', "Oldindan to'liq pul o'tkazmang, ishni bosqichma-bosqich to'lang", "Shubhali bo'lsa, «Shikoyat qilish»ni bosing"].map((x) => (
              <View key={x} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: t.price, fontWeight: '900' }}>✓</Text>
                <Text style={{ color: t.ink, fontSize: 13, lineHeight: 18, flex: 1 }}>{x}</Text>
              </View>
            ))}
          </LinearGradient>

          {mine ? (
            <View style={{ gap: 8 }}>
              {PAYMENTS_IN_APP || isAdmin ? <Btn title="Reklama qilish (TOP / VIP)" icon="rocket-outline" onPress={() => router.push(`/promo/${ad.id}`)} /> : null}
              <Btn kind="sec" title="Tahrirlash" icon="create-outline" onPress={() => router.push({ pathname: '/post', params: { id: ad.id } })} />
            </View>
          ) : null}
          {isAdmin && !mine ? (
            <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: t.danger, borderRadius: 16, padding: 12, gap: 8 }}>
              <Text style={{ color: t.muted, fontSize: 13 }}>Moderator: qoidaga zid e'lonni olib tashlash</Text>
              <Btn kind="dng" small title={sure ? "Ha, olib tashlash" : "O'chirish"} onPress={modDelete} />
            </View>
          ) : null}
          {!mine ? (
            <Pressable onPress={() => setReportOpen(true)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'center', paddingVertical: 8 }}>
              <Ionicons name="flag-outline" size={15} color={t.muted} />
              <Text style={{ color: t.muted, fontWeight: '700', fontSize: 13 }}>E'lon ustidan shikoyat qilish</Text>
            </Pressable>
          ) : null}

          {similar.length ? (
            <>
              <H>O'xshash e'lonlar</H>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
                {similar.map((a) => <AdCard key={a.id} ad={a} width={170} onPress={() => router.push(`/ad/${a.id}`)} />)}
              </ScrollView>
            </>
          ) : null}
        </View>
      </ScrollView>

      <ListPicker visible={reportOpen} onClose={() => setReportOpen(false)} title="Shikoyat sababi" value={null} items={REASONS} onPick={sendReport} />
      {!mine && st === 'live' ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, paddingBottom: ins.bottom + 12,
          ...(Platform.OS === 'web' ? { boxShadow: '0 -8px 24px rgba(0,0,0,0.10)' } : { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12 }) }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', maxWidth: 728, width: '100%', alignSelf: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.muted, fontSize: 11, fontWeight: '600' }}>Narx</Text>
              <Text style={{ color: t.ink, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>{priceText(ad)}</Text>
            </View>
            {ad.phone ? (
              <Press onPress={() => { if (!phone) setPhone(true); else Linking.openURL('tel:' + ad.phone.replace(/[^\d+]/g, '')).catch(() => {}); }}
                accessibilityLabel="Qo'ng'iroq" style={{ height: 52, minWidth: 52, paddingHorizontal: phone ? 14 : 0, borderRadius: 18, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                <Ionicons name="call" size={20} color={t.accent} />
                {phone ? <Text style={{ color: t.accent, fontWeight: '800' }}>{ad.phone}</Text> : null}
              </Press>
            ) : null}
            <Press onPress={write} disabled={busy} accessibilityLabel="Yozish">
              <LinearGradient colors={['#5A7BFF', '#2747D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 52, paddingHorizontal: 24, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{busy ? '...' : 'Yozish'}</Text>
              </LinearGradient>
            </Press>
          </View>
        </View>
      ) : null}
    </View>
  );
}
