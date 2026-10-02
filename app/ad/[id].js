import React, { useEffect, useState } from 'react';
import { ListPicker } from '../../src/pickers';
import { Linking, Platform, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../../src/theme';
import { useApp, useRequire } from '../../src/app-context';
import { supabase, publicUrl, errText } from '../../src/supabase';
import { catOf } from '../../src/data';
import { ago, adState, isTop, isVip, locLabel, priceText, since, seenText, isOnline } from '../../src/format';
import { fetchFeed } from '../../src/api';
import { WEB_URL } from '../../src/config';
import { AdCard, Avatar, Badge, Btn, Cover, Empty, H, Loading, Note } from '../../src/ui';

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

  const fact = (k, v) => (
    <View style={{ width: '50%', padding: 10, borderColor: t.line, borderWidth: 0.5, backgroundColor: t.surface }}>
      <Text style={{ fontSize: 11, color: t.muted, fontWeight: '700', letterSpacing: 0.6 }}>{k.toUpperCase()}</Text>
      <Text style={{ fontSize: 14, color: t.ink, fontWeight: '600', marginTop: 2 }}>{v}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{
        title: catOf(ad.cat).n,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 18, marginRight: Platform.OS === 'web' ? 14 : 0 }}>
            <Pressable onPress={share} hitSlop={10} accessibilityLabel="Ulashish"><Ionicons name="share-outline" size={22} color={t.ink} /></Pressable>
            <Pressable onPress={() => toggleFav(ad.id)} hitSlop={10} accessibilityLabel="Saralash"><Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? t.danger : t.ink} /></Pressable>
          </View>
        ),
      }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
        <View style={{ width: W, aspectRatio: 4 / 3, backgroundColor: '#0d0f0e' }}>
          {photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
              onScroll={Platform.OS === 'web' ? (e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W)) : undefined} scrollEventThrottle={64}>
              {photos.map((u) => <Image key={u} source={{ uri: u }} style={{ width: W, height: '100%' }} contentFit="contain" transition={200} />)}
            </ScrollView>
          ) : <Cover cat={ad.cat} big />}
          {photos.length > 1 ? (
            <View style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{page + 1} / {photos.length}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ padding: 16, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {isVip(ad) ? <Badge kind="vip">VIP</Badge> : isTop(ad) ? <Badge kind="top">TOP</Badge> : null}
            {ad.kind === 'buyurtma' ? <Badge kind="req">BUYURTMA</Badge> : null}
            <Text style={{ color: t.muted, fontSize: 12 }}>{ago(ad.created_at)}</Text>
          </View>
          <Text style={{ fontSize: 21, fontWeight: '800', color: t.ink, lineHeight: 27 }}>{ad.title}</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.price }}>{priceText(ad)}{ad.negotiable && +ad.price ? <Text style={{ fontSize: 13, color: t.muted }}> · kelishiladi</Text> : null}</Text>
          {st !== 'live' ? <Note kind="gold">{st === 'expired' ? "Bu e'lonning muddati tugagan, u qidiruvda ko'rinmaydi." : "Bu e'lon arxivda."}</Note> : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: t.line, marginTop: 8 }}>
            {fact('Turi', ad.kind === 'buyurtma' ? 'Buyurtma' : 'Xizmat taklifi')}
            {fact('Kategoriya', catOf(ad.cat).n)}
            {fact('Hudud', locLabel(ad))}
            {fact('Tajriba', ad.exp_years ? ad.exp_years + ' yil' : '—')}
          </View>

          <H>Tavsif</H>
          <Text selectable style={{ color: t.ink, fontSize: 15, lineHeight: 23 }}>{ad.description}</Text>

          <H>{ad.kind === 'buyurtma' ? 'Buyurtmachi' : 'Ijrochi'}</H>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 12 }}>
            <Avatar profile={seller} name={ad.seller_name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: '700', color: t.ink, fontSize: 15 }} numberOfLines={1}>{seller?.name || ad.seller_name}</Text>
              {seller?.bio ? <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={3}>{seller.bio}</Text> : null}
              {seller?.last_seen ? <Text style={{ color: isOnline(seller.last_seen) ? t.price : t.muted, fontSize: 12, fontWeight: isOnline(seller.last_seen) ? '700' : '400' }}>{isOnline(seller.last_seen) ? '● ' : ''}{seenText(seller.last_seen)}</Text> : null}
              {seller ? <Text style={{ color: t.muted, fontSize: 12 }}>{since(seller.created_at)}</Text> : null}
            </View>
          </View>

          {mine ? (
            <View style={{ gap: 8, marginTop: 14 }}>
              <Btn title="Reklama qilish (TOP / VIP)" icon="rocket-outline" onPress={() => router.push(`/promo/${ad.id}`)} />
              <Btn kind="sec" title="Tahrirlash" icon="create-outline" onPress={() => router.push({ pathname: '/post', params: { id: ad.id } })} />
            </View>
          ) : null}
          {isAdmin && !mine ? (
            <View style={{ marginTop: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.danger, borderRadius: 12, padding: 12, gap: 8 }}>
              <Text style={{ color: t.muted, fontSize: 13 }}>Moderator: qoidaga zid e'lonni olib tashlash</Text>
              <Btn kind="dng" small title={sure ? "Ha, olib tashlash" : "O'chirish"} onPress={modDelete} />
            </View>
          ) : null}

          {!mine ? (
            <Pressable onPress={() => setReportOpen(true)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', marginTop: 14, paddingVertical: 6 }}>
              <Ionicons name="flag-outline" size={16} color={t.danger} />
              <Text style={{ color: t.danger, fontWeight: '700' }}>Shikoyat qilish</Text>
            </Pressable>
          ) : null}

          {similar.length ? (
            <>
              <H>O'xshash e'lonlar</H>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {similar.map((a) => <AdCard key={a.id} ad={a} width={160} onPress={() => router.push(`/ad/${a.id}`)} />)}
              </ScrollView>
            </>
          ) : null}
        </View>
      </ScrollView>

      <ListPicker visible={reportOpen} onClose={() => setReportOpen(false)} title="Shikoyat sababi" value={null} items={REASONS} onPick={sendReport} />
      {!mine && st === 'live' ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.line, paddingHorizontal: 16, paddingTop: 10, paddingBottom: ins.bottom + 10 }}>
          <View style={{ flexDirection: 'row', gap: 8, maxWidth: 728, width: '100%', alignSelf: 'center' }}>
            <Btn style={{ flex: 1 }} title="Yozish" icon="chatbubble-ellipses-outline" onPress={write} loading={busy} />
            {ad.phone ? (
              <Btn style={{ flex: 1 }} kind="sec" icon="call-outline" title={phone ? ad.phone : 'Raqam'}
                onPress={() => { if (!phone) setPhone(true); else Linking.openURL('tel:' + ad.phone.replace(/[^\d+]/g, '')).catch(() => {}); }} />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
