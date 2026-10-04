import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useT, FONT } from '../../src/theme';
import { useApp, useRequire } from '../../src/app-context';
import { CATS, ONLINE } from '../../src/data';
import { shortReg } from '../../src/format';
import { supabase } from '../../src/supabase';
import { fetchFeed, fetchVip, fetchProfiles, PAGE } from '../../src/api';
import { CatRow, HowItWorks, TopCreators, useStats, Stories, PromoCarousel, StatStrip } from '../../src/home';
import { RegionPicker, ListPicker } from '../../src/pickers';
import { AdCard, Empty, FadeIn, H, Pill, Skeleton } from '../../src/ui';
import { tr, LANGS, setLang, useLang } from '../../src/i18n';

export default function Home() {
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const need = useRequire();
  const { fav, toggleFav } = useApp();
  const { width } = useWindowDimensions();
  const W = Math.min(width, 1100);
  const cols = W < 640 ? 2 : W < 960 ? 3 : 4;
  const gap = 10;
  const cardW = (W - 32 - gap * (cols - 1)) / cols;

  const [search, setSearch] = useState('');
  const [sq, setSq] = useState('');
  const [cat, setCat] = useState(null);
  const [kind, setKind] = useState(null);
  const [sort, setSort] = useState('new');
  const [loc, setLoc] = useState({ region: '', district: '' });
  const [items, setItems] = useState([]);
  const [vip, setVip] = useState([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [err, setErr] = useState('');
  const [regOpen, setRegOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const lang = useLang();
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);
  const stats = useStats();
  const [people, setPeople] = useState([]);

  useEffect(() => { AsyncStorage.getItem('loc').then((v) => { try { if (v) setLoc(JSON.parse(v)); } catch (e) {} }); }, []);
  useEffect(() => { const id = setTimeout(() => setSq(search), 300); return () => clearTimeout(id); }, [search]);

  const filters = useMemo(() => ({ search: sq, cat, kind, sort, region: loc.region, district: loc.district }), [sq, cat, kind, sort, loc]);
  const active = !!(sq || cat || kind);

  const load = useCallback(async (reset) => {
    const id = ++reqId.current;
    try {
      setErr('');
      const from = reset ? 0 : items.length;
      let f = { ...filters };
      const idq = String(filters.search || '').trim().replace(/^id\s*/i, '');
      if (/^\d{6,9}$/.test(idq)) {
        const { data: pr } = await supabase.from('profiles').select('id').eq('public_id', +idq).maybeSingle();
        f = { ...f, search: '', userId: pr?.id || '00000000-0000-0000-0000-000000000000' };
      }
      const rows = await fetchFeed({ ...f, from });
      if (id !== reqId.current) return;
      setItems(reset ? rows : [...items, ...rows]);
      setMore(rows.length === PAGE);
    } catch (e) {
      if (id === reqId.current) setErr(tr("E'lonlarni yuklab bo'lmadi. Internetni tekshiring."));
    } finally {
      if (id === reqId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [filters, items]);

  useEffect(() => { setLoading(true); load(true); /* eslint-disable-next-line */ }, [filters]);
  useEffect(() => { fetchVip(loc.region).then(setVip).catch(() => {}); }, [loc.region]);
  // Top ijodkorlar: lentadagi eng ko'p e'lonli sotuvchilar
  useEffect(() => {
    if (active || !items.length) return;
    const cnt = {}, first = {};
    items.forEach((a) => { cnt[a.user_id] = (cnt[a.user_id] || 0) + 1; if (!first[a.user_id]) first[a.user_id] = a.id; });
    const ids = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).slice(0, 12);
    fetchProfiles(ids).then((pr) => setPeople(ids.filter((i) => pr[i]).map((i) => ({ ...pr[i], id: i, n: cnt[i], ad: first[i] })))).catch(() => {});
  }, [items, active]);

  const pickLoc = (region, district) => {
    const v = { region, district };
    setLoc(v); setRegOpen(false); AsyncStorage.setItem('loc', JSON.stringify(v));
  };
  const locText = loc.region ? (loc.district || shortReg(loc.region)) : tr("Butun O'zbekiston");
  const open = (ad) => router.push(`/ad/${ad.id}`);

  const header = (
    <View>
      {!active ? (
        <>
          <Stories onPick={setCat} />
          <PromoCarousel width={W - 32} slides={[
            { colors: ['#4A6CFF', '#1631B8'], icon: 'sparkles', tag: tr("Ijodkorlar bozori"), title: tr("Kerakli ijodkor shu yerda"), text: tr("Barcha viloyat va tumanlardagi mutaxassislar"), cta: tr("Xizmatlarni ko'rish"), onPress: () => setKind('xizmat') },
            { colors: ['#FFA155', '#F0532E'], icon: 'film', tag: tr("Video montaj"), title: tr("Reels montaj — tez va sifatli"), text: tr("Montajchilarning narxi va ishlarini solishtiring"), cta: tr("Ko'rish"), onPress: () => setCat('montaj') },
            { colors: ['#34DBA5', '#0C9A6A'], icon: 'phone-portrait', tag: tr("SMM"), title: tr("Biznesingizga SMM mutaxassisi"), text: tr("Instagram, Telegram va TikTok sahifalarini yuritish"), cta: tr("Tanlash"), onPress: () => setCat('smm') },
            { colors: ['#AE8CFF', '#6A3FE0'], icon: 'add-circle', tag: tr("Bepul"), title: tr("Xizmatingizni joylang"), text: tr("Mijozlar sizni o'zi topib, chatga yozadi"), cta: tr("E'lon joylash"), onPress: () => { if (need('/post')) router.push('/post'); } },
            { colors: ['#FF77AE', '#D8246C'], icon: 'color-palette', tag: tr("Dizayn"), title: tr("Logotip, banner va brendbuk"), text: tr("Grafik dizaynerlar bir joyda"), cta: tr("Ko'rish"), onPress: () => setCat('dizayn') },
          ]} />
          <StatStrip stats={stats} />
          <H right={tr("12 yo'nalish")}>{tr("Kategoriyalar")}</H>
          <CatRow counts={stats.cats} onPick={setCat} />
          {vip.length ? (
            <View style={{ backgroundColor: t.goldSoft, borderRadius: 22, padding: 14, paddingTop: 0, marginTop: 18 }}>
              <H right={tr("{0} ta", vip.length)}>{tr("★ VIP e'lonlar")}</H>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {vip.map((a) => <AdCard key={a.id} ad={a} width={160} onPress={() => open(a)} fav={fav.includes(a.id)} onFav={() => toggleFav(a.id)} />)}
              </ScrollView>
            </View>
          ) : null}
          {people.length ? (<><H right={tr("eng faollar")}>{tr("Top ijodkorlar")}</H><TopCreators people={people} onOpen={(p) => router.push(`/ad/${p.ad}`)} /></>) : null}
          <H>{tr("Qanday ishlaydi")}</H>
          <HowItWorks />
        </>
      ) : (
        <View style={{ paddingTop: 14, gap: 4 }}>
          <Pressable onPress={() => { setCat(null); setKind(null); setSearch(''); }}><Text style={{ color: t.accent, fontWeight: '700' }}>{tr("‹ Asosiy")}</Text></Pressable>
          <Text style={{ fontFamily: FONT.displayM, fontSize: 20, color: t.ink }}>
            {sq ? tr("«{0}» bo'yicha", sq) : cat ? CATS.find((c) => c.id === cat)?.n : kind === 'buyurtma' ? tr("Buyurtmalar") : tr("Xizmatlar")}
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        <Pill title={locText} icon="location-outline" on={!!loc.region} onPress={() => setRegOpen(true)} />
        {cat ? <Pill title={CATS.find((c) => c.id === cat)?.n + '  ✕'} on onPress={() => setCat(null)} /> : null}
        <Pill title={tr("Xizmatlar")} on={kind === 'xizmat'} onPress={() => setKind(kind === 'xizmat' ? null : 'xizmat')} />
        <Pill title={tr("Buyurtmalar")} on={kind === 'buyurtma'} onPress={() => setKind(kind === 'buyurtma' ? null : 'buyurtma')} />
        <Pill title={tr({ new: 'Avval yangilari', cheap: 'Avval arzonlari', exp: 'Avval qimmatlari' }[sort])} icon="swap-vertical" onPress={() => setSortOpen(true)} />
      </ScrollView>
      {!active ? <H style={{ paddingTop: 4 }} right={loc.region ? locText + tr(" + onlayn") : tr("Butun O'zbekiston")}>{tr("Yangi e'lonlar")}</H> : null}
      {err ? <Empty title={tr("Xatolik")} text={err} action={tr("Qayta urinish")} onAction={() => { setLoading(true); load(true); }} /> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: ins.top + 8, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: t.bg, borderBottomWidth: 1, borderColor: t.line, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1068, width: '100%', alignSelf: 'center' }}>
          <Pressable onPress={() => { setCat(null); setKind(null); setSearch(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 30, height: 30, borderRadius: 9 }} />
            <Text style={{ fontFamily: FONT.display, fontSize: 20, color: t.ink }}>mohir</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', maxWidth: '62%' }}>
            <Pressable onPress={() => setRegOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: 999, height: 34, paddingHorizontal: 11, flexShrink: 1 }}>
              <Ionicons name="location-outline" size={16} color={t.accent} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }} numberOfLines={1}>{locText}</Text>
            </Pressable>
            <Pressable onPress={() => setLangOpen(true)} accessibilityLabel="Til / Язык / Language" style={{ height: 34, minWidth: 34, paddingHorizontal: 8, borderRadius: 17, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 }}>
              <Ionicons name="globe-outline" size={16} color={t.ink} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: t.ink }}>{lang.toUpperCase()}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/support')} accessibilityLabel={tr("Qo'llab-quvvatlash")} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="headset-outline" size={17} color={t.ink} />
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12, paddingHorizontal: 12, height: 46, maxWidth: 1068, width: '100%', alignSelf: 'center' }}>
          <Ionicons name="search" size={19} color={t.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder={tr("Xizmat, tuman yoki foydalanuvchi ID…")} placeholderTextColor={t.muted}
            style={{ flex: 1, fontSize: 16, color: t.ink, height: '100%' }} returnKeyType="search" autoCorrect={false} />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={10}><Ionicons name="close-circle" size={19} color={t.muted} /></Pressable> : null}
        </View>
      </View>

      <FlatList
        key={'cols' + cols}
        data={loading ? Array.from({ length: cols * 2 }, (_, i) => ({ id: 'sk' + i, _sk: true })) : items}
        numColumns={cols}
        keyExtractor={(a) => a.id}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap, maxWidth: 1100, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => item._sk ? <Skeleton width={cardW} /> : (
          <FadeIn index={index % (cols * 4)}>
            <AdCard ad={item} width={cardW} onPress={() => open(item)} fav={fav.includes(item.id)} onFav={() => toggleFav(item.id)} />
          </FadeIn>
        )}
        ListEmptyComponent={loading || err ? null : (
          <Empty title={active || loc.region ? tr("Hech narsa topilmadi") : tr("Hozircha e'lonlar yo'q")}
            text={active || loc.region ? tr("Boshqa so'z bilan qidiring yoki hududni kengaytiring.") : tr("Birinchi bo'lib xizmatingizni joylang: mijozlar sizni shu yerdan topadi.")}
            action={active ? tr("Filtrlarni tozalash") : tr("E'lon joylash")}
            onAction={() => { if (active) { setCat(null); setKind(null); setSearch(''); } else if (need('/post')) router.push('/post'); }} />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => { if (more && !loading && items.length) load(false); }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(true); fetchVip(loc.region).then(setVip).catch(() => {}); }} />}
      />

      <RegionPicker visible={regOpen} onClose={() => setRegOpen(false)} onPick={pickLoc} allowAll current={loc} />
      <ListPicker visible={langOpen} onClose={() => setLangOpen(false)} title="Til · Язык · Language" value={lang} onPick={(l) => { setLangOpen(false); setLang(l); }}
        items={LANGS.map(([k, n, f]) => [k, f + '  ' + n])} />
      <ListPicker visible={sortOpen} onClose={() => setSortOpen(false)} title={tr("Saralash")} value={sort} onPick={setSort}
        items={[['new', tr("Avval yangilari")], ['cheap', tr("Avval arzonlari")], ['exp', tr("Avval qimmatlari")]]} />
    </View>
  );
}
