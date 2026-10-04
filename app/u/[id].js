// Ijodkorning ochiq profili: ma'lumot, reyting, baholar va barcha e'lonlari
import React, { useCallback, useState } from 'react';
import { FlatList, Platform, Share, Text, useWindowDimensions, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useT, FONT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase } from '../../src/supabase';
import { fetchFeed, fetchProfiles } from '../../src/api';
import { catOf, ONLINE } from '../../src/data';
import { ago, isOnline, seenText, shortReg, since } from '../../src/format';
import { AdCard, Avatar, Btn, Empty, H, Loading, Press } from '../../src/ui';
import { RatingLine, Stars } from '../../src/lists';
import { WEB_URL } from '../../src/config';
import { tr, adsCount } from '../../src/i18n';

export default function PublicProfile() {
  const { id, tab } = useLocalSearchParams();
  const t = useT();
  const router = useRouter();
  const { uid, fav, toggleFav } = useApp();
  const { width } = useWindowDimensions();
  const W = Math.min(width, 1100);
  const cols = W < 640 ? 2 : W < 960 ? 3 : 4;
  const cardW = (W - 32 - 10 * (cols - 1)) / cols;
  const [p, setP] = useState(undefined);
  const [ads, setAds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [authors, setAuthors] = useState({});
  const [view, setView] = useState(tab === 'reviews' ? 'reviews' : 'ads');

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setP(data || null);
    if (!data) return;
    const [a, r] = await Promise.all([
      fetchFeed({ userId: id, limit: 60 }).catch(() => []),
      supabase.from('reviews').select('*').eq('target_id', id).order('created_at', { ascending: false }).limit(100),
    ]);
    setAds(a); setReviews(r.data || []);
    setAuthors(await fetchProfiles((r.data || []).map((x) => x.author_id)));
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (p === undefined) return <View style={{ flex: 1, backgroundColor: t.bg }}><Loading /></View>;
  if (!p) return <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}><Empty title={tr('Foydalanuvchi topilmadi')} /></View>;

  const me = uid === p.id;
  const loc = p.region ? (p.region === ONLINE ? tr('Onlayn') : [p.district, shortReg(p.region)].filter(Boolean).join(', ')) : '';
  const share = async () => {
    const url = `${WEB_URL}/u/${p.id}`;
    try { await Share.share(Platform.OS === 'ios' ? { message: p.name, url } : { message: `${p.name}\n${url}` }); } catch (e) {}
  };
  const dist = [5, 4, 3, 2, 1].map((s) => [s, reviews.filter((r) => r.stars === s).length]);

  const header = (
    <View style={{ gap: 12, marginBottom: 6 }}>
      <LinearGradient colors={['#4A6CFF', '#2747D6', '#1631B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, gap: 12, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View>
            <View style={{ padding: 3, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.35)' }}><Avatar profile={p} size={72} /></View>
            {isOnline(p.last_seen) ? <View style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#2747D6' }} /> : null}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 19, color: '#fff' }} numberOfLines={2}>{p.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }} numberOfLines={1}>{[p.cat ? catOf(p.cat).n : tr('Buyurtmachi'), loc].filter(Boolean).join(' · ')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>ID {p.public_id} · {p.last_seen ? seenText(p.last_seen) : since(p.created_at)}</Text>
          </View>
          <Press onPress={share} accessibilityLabel={tr('Ulashish')} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="share-social-outline" size={19} color="#fff" />
          </Press>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: 16, paddingVertical: 10 }}>
          {[[p.rating_count ? Number(p.rating).toFixed(1) : '—', tr('reyting')], [String(p.rating_count || 0), tr('baho')], [String(ads.length), tr("e'lon")]].map(([v, l], i) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 18, color: '#fff' }}>{i === 0 && p.rating_count ? '★ ' : ''}{v}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '600' }}>{l}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      {p.bio ? <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 14 }}><Text style={{ color: t.ink, lineHeight: 21 }}>{p.bio}</Text></View> : null}
      {me ? <Btn kind="sec" icon="create-outline" title={tr('Profilni tahrirlash')} onPress={() => router.push('/profile')} /> : null}
      <View style={{ flexDirection: 'row', backgroundColor: t.chip, borderRadius: 14, padding: 3 }}>
        {[['ads', tr("E'lonlar ({0})", ads.length)], ['reviews', tr('Baholar ({0})', reviews.length)]].map(([k, l]) => (
          <Press key={k} onPress={() => setView(k)} haptic={false} style={{ flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: view === k ? t.surface : 'transparent' }}>
            <Text style={{ fontWeight: '800', color: view === k ? t.ink : t.muted }}>{l}</Text>
          </Press>
        ))}
      </View>
      {view === 'reviews' && reviews.length ? (
        <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 34, color: t.ink }}>{Number(p.rating).toFixed(1)}</Text>
            <Stars value={Number(p.rating)} size={14} />
            <Text style={{ color: t.muted, fontSize: 12 }}>{tr('{0} ta baho', p.rating_count)}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {dist.map(([s, n]) => (
              <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: t.muted, fontSize: 12, width: 10 }}>{s}</Text>
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.chip, overflow: 'hidden' }}>
                  <View style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%`, height: 6, backgroundColor: '#F5A623' }} />
                </View>
                <Text style={{ color: t.muted, fontSize: 12, width: 22, textAlign: 'right' }}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ title: p.name }} />
      {view === 'ads' ? (
        <FlatList key={'a' + cols} data={ads} numColumns={cols} keyExtractor={(a) => a.id} columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 1100, width: '100%', alignSelf: 'center' }}
          ListHeaderComponent={header}
          renderItem={({ item }) => <AdCard ad={item} width={cardW} onPress={() => router.push(`/ad/${item.id}`)} fav={fav.includes(item.id)} onFav={() => toggleFav(item.id)} />}
          ListEmptyComponent={<Empty title={tr("Faol e'lonlar yo'q")} />} />
      ) : (
        <FlatList key="r" data={reviews} keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}
          ListHeaderComponent={header}
          renderItem={({ item: r }) => (
            <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar profile={authors[r.author_id]} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.ink, fontWeight: '700' }} numberOfLines={1}>{authors[r.author_id]?.name || tr('Foydalanuvchi')}</Text>
                  <Text style={{ color: t.muted, fontSize: 11.5 }}>{ago(r.created_at)}</Text>
                </View>
                <Stars value={r.stars} size={14} />
              </View>
              {r.body ? <Text style={{ color: t.ink, lineHeight: 20 }}>{r.body}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<Empty title={tr("Hali baho yo'q")} text={tr("Baholarni faqat shu ijodkor bilan chatda yozishgan foydalanuvchilar qoldira oladi.")} />} />
      )}
    </View>
  );
}
