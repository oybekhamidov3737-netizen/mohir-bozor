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
import { fetchFeed, fetchVip, PAGE } from '../../src/api';
import { RegionPicker, ListPicker } from '../../src/pickers';
import { AdCard, Btn, Empty, H, Loading, Pill, Press } from '../../src/ui';

const WORDS = ['SMMchi', 'montajchi', 'mobilograf', 'targetolog', 'dizayner', 'kopirayter'];

function Rotator({ color }) {
  const [i, setI] = useState(0);
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start(() => {
        setI((x) => (x + 1) % WORDS.length);
        Animated.timing(a, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start();
      });
    }, 2200);
    return () => clearInterval(id);
  }, [a]);
  return (
    <Animated.Text style={{ fontFamily: FONT.display, fontSize: 26, color, textDecorationLine: 'underline', opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      {WORDS[i]}
    </Animated.Text>
  );
}

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
  const [refreshing, setRefreshing] = useState(false);
  const reqId = useRef(0);

  useEffect(() => { AsyncStorage.getItem('loc').then((v) => { try { if (v) setLoc(JSON.parse(v)); } catch (e) {} }); }, []);
  useEffect(() => { const id = setTimeout(() => setSq(search), 300); return () => clearTimeout(id); }, [search]);

  const filters = useMemo(() => ({ search: sq, cat, kind, sort, region: loc.region, district: loc.district }), [sq, cat, kind, sort, loc]);
  const active = !!(sq || cat || kind);

  const load = useCallback(async (reset) => {
    const id = ++reqId.current;
    try {
      setErr('');
      const from = reset ? 0 : items.length;
      const rows = await fetchFeed({ ...filters, from });
      if (id !== reqId.current) return;
      setItems(reset ? rows : [...items, ...rows]);
      setMore(rows.length === PAGE);
    } catch (e) {
      if (id === reqId.current) setErr("E'lonlarni yuklab bo'lmadi. Internetni tekshiring.");
    } finally {
      if (id === reqId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [filters, items]);

  useEffect(() => { setLoading(true); load(true); /* eslint-disable-next-line */ }, [filters]);
  useEffect(() => { fetchVip(loc.region).then(setVip).catch(() => {}); }, [loc.region]);

  const pickLoc = (region, district) => {
    const v = { region, district };
    setLoc(v); setRegOpen(false); AsyncStorage.setItem('loc', JSON.stringify(v));
  };
  const locText = loc.region ? (loc.district || shortReg(loc.region)) : "Butun O'zbekiston";
  const open = (ad) => router.push(`/ad/${ad.id}`);

  const header = (
    <View>
      {!active ? (
        <View style={{ marginTop: 14, borderRadius: 22, backgroundColor: t.accent, padding: 20, overflow: 'hidden' }}>
          <Ionicons name="sparkles" size={110} color={t.accentInk} style={{ position: 'absolute', right: -16, top: -18, opacity: 0.12 }} />
          <Text style={{ fontFamily: FONT.display, fontSize: 26, color: t.accentInk, lineHeight: 32 }}>Kerakli</Text>
          <Rotator color={t.accentInk} />
          <Text style={{ fontFamily: FONT.display, fontSize: 26, color: t.accentInk, lineHeight: 32 }}>shu yerda</Text>
          <Text style={{ color: t.accentInk, opacity: 0.85, marginTop: 10, marginBottom: 14, lineHeight: 20 }}>
            O'zbekistonning barcha viloyat va tumanlaridagi ijodkorlar. Narxni ko'ring, ilova ichida yozing.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Press onPress={() => { if (need('/post')) router.push('/post'); }} style={{ backgroundColor: t.accentInk, borderRadius: 10, paddingHorizontal: 14, height: 38, justifyContent: 'center' }}>
              <Text style={{ color: t.accent, fontWeight: '800' }}>E'lon joylash</Text>
            </Press>
            <Press onPress={() => setRegOpen(true)} style={{ borderColor: t.accentInk, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 38, justifyContent: 'center' }}>
              <Text style={{ color: t.accentInk, fontWeight: '700' }}>Hududni tanlash</Text>
            </Press>
          </View>
        </View>
      ) : null}

      {!active ? (
        <>
          <H>Kategoriyalar</H>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
            {CATS.map((c) => (
              <Press key={c.id} onPress={() => setCat(c.id)} style={{ width: (W - 32) / (cols === 2 ? 4 : cols === 3 ? 6 : 12), alignItems: 'center', gap: 6 }}>
                <View style={{ width: 54, height: 54, borderRadius: 17, backgroundColor: t.cover[c.c], alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={c.icon} size={25} color={t.coverInk} />
                </View>
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: t.ink, textAlign: 'center' }} numberOfLines={2}>{c.n}</Text>
              </Press>
            ))}
          </View>
          {vip.length ? (
            <View style={{ backgroundColor: t.goldSoft, borderRadius: 18, padding: 14, paddingTop: 0, marginTop: 18 }}>
              <H right={`${vip.length} ta`}>VIP e'lonlar</H>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {vip.map((a) => <AdCard key={a.id} ad={a} width={160} onPress={() => open(a)} fav={fav.includes(a.id)} onFav={() => toggleFav(a.id)} />)}
              </ScrollView>
            </View>
          ) : null}
        </>
      ) : (
        <View style={{ paddingTop: 14, gap: 4 }}>
          <Pressable onPress={() => { setCat(null); setKind(null); setSearch(''); }}><Text style={{ color: t.accent, fontWeight: '700' }}>‹ Asosiy</Text></Pressable>
          <Text style={{ fontFamily: FONT.displayM, fontSize: 20, color: t.ink }}>
            {sq ? `«${sq}» bo'yicha` : cat ? CATS.find((c) => c.id === cat)?.n : kind === 'buyurtma' ? 'Buyurtmalar' : 'Xizmatlar'}
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        <Pill title={locText} icon="location-outline" on={!!loc.region} onPress={() => setRegOpen(true)} />
        {cat ? <Pill title={CATS.find((c) => c.id === cat)?.n + '  ✕'} on onPress={() => setCat(null)} /> : null}
        <Pill title="Xizmatlar" on={kind === 'xizmat'} onPress={() => setKind(kind === 'xizmat' ? null : 'xizmat')} />
        <Pill title="Buyurtmalar" on={kind === 'buyurtma'} onPress={() => setKind(kind === 'buyurtma' ? null : 'buyurtma')} />
        <Pill title={{ new: 'Avval yangilari', cheap: 'Avval arzonlari', exp: 'Avval qimmatlari' }[sort]} icon="swap-vertical" onPress={() => setSortOpen(true)} />
      </ScrollView>
      {!active ? <H style={{ paddingTop: 4 }} right={loc.region ? locText + ' + onlayn' : "Butun O'zbekiston"}>Yangi e'lonlar</H> : null}
      {err ? <Empty title="Xatolik" text={err} action="Qayta urinish" onAction={() => { setLoading(true); load(true); }} /> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: ins.top + 8, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: t.bg, borderBottomWidth: 1, borderColor: t.line, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1068, width: '100%', alignSelf: 'center' }}>
          <Pressable onPress={() => { setCat(null); setKind(null); setSearch(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONT.display, color: t.accentInk, fontSize: 15 }}>M</Text>
            </View>
            <Text style={{ fontFamily: FONT.display, fontSize: 20, color: t.ink }}>mohir</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', maxWidth: '62%' }}>
            <Pressable onPress={() => setRegOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: 999, height: 34, paddingHorizontal: 11, flexShrink: 1 }}>
              <Ionicons name="location-outline" size={16} color={t.accent} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }} numberOfLines={1}>{locText}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/support')} accessibilityLabel="Qo'llab-quvvatlash" style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="headset-outline" size={17} color={t.ink} />
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12, paddingHorizontal: 12, height: 46, maxWidth: 1068, width: '100%', alignSelf: 'center' }}>
          <Ionicons name="search" size={19} color={t.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Xizmat, shahar yoki tuman: montaj, Chilonzor…" placeholderTextColor={t.muted}
            style={{ flex: 1, fontSize: 16, color: t.ink, height: '100%' }} returnKeyType="search" autoCorrect={false} />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={10}><Ionicons name="close-circle" size={19} color={t.muted} /></Pressable> : null}
        </View>
      </View>

      <FlatList
        key={'cols' + cols}
        data={loading ? [] : items}
        numColumns={cols}
        keyExtractor={(a) => a.id}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap, maxWidth: 1100, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <AdCard ad={item} width={cardW} onPress={() => open(item)} fav={fav.includes(item.id)} onFav={() => toggleFav(item.id)} />
        )}
        ListEmptyComponent={loading ? <Loading /> : err ? null : (
          <Empty title={active || loc.region ? 'Hech narsa topilmadi' : "Hozircha e'lonlar yo'q"}
            text={active || loc.region ? "Boshqa so'z bilan qidiring yoki hududni kengaytiring." : "Birinchi bo'lib xizmatingizni joylang: mijozlar sizni shu yerdan topadi."}
            action={active ? 'Filtrlarni tozalash' : "E'lon joylash"}
            onAction={() => { if (active) { setCat(null); setKind(null); setSearch(''); } else if (need('/post')) router.push('/post'); }} />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => { if (more && !loading && items.length) load(false); }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(true); fetchVip(loc.region).then(setVip).catch(() => {}); }} />}
      />

      <RegionPicker visible={regOpen} onClose={() => setRegOpen(false)} onPick={pickLoc} allowAll current={loc} />
      <ListPicker visible={sortOpen} onClose={() => setSortOpen(false)} title="Saralash" value={sort} onPick={setSort}
        items={[['new', 'Avval yangilari'], ['cheap', 'Avval arzonlari'], ['exp', 'Avval qimmatlari']]} />
    </View>
  );
}
