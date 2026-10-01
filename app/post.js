import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../src/theme';
import { useApp, useRequire } from '../src/app-context';
import { supabase, publicUrl, errText } from '../src/supabase';
import { CATS, ONLINE, UNITS, catOf, checkText } from '../src/data';
import { fmtNum, shortReg } from '../src/format';
import { pickImages, uploadImage, newName } from '../src/images';
import { RegionPicker, ListPicker } from '../src/pickers';
import { Btn, Check, Field, Loading, Note, Seg, Select } from '../src/ui';

const MAX_PH = 6;

export default function PostAd() {
  const { id } = useLocalSearchParams();
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const need = useRequire();
  const { uid, profile, toast } = useApp();
  const [f, setF] = useState(null);
  const [photos, setPhotos] = useState([]); // {path} mavjud yoki {uri, base64} yangi
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState('');
  const [picker, setPicker] = useState(null);

  useEffect(() => { need('/post'); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!uid || !profile) return;
    if (id) {
      supabase.from('ads').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (!data) { toast("E'lon topilmadi"); router.back(); return; }
        setF({ ...data, price: data.price ? fmtNum(data.price) : '' });
        setPhotos((data.photos || []).map((p) => ({ path: p })));
      });
    } else {
      setF({ kind: 'xizmat', title: '', cat: profile.cat || 'smm', price: '', cur: 'uzs', unit: '', price_from: false, negotiable: false,
        region: profile.region || '', district: profile.district || '', exp_years: '', description: '', seller_name: profile.name || '', phone: profile.phone || '' });
    }
  }, [id, uid, profile]);

  if (!f) return <View style={{ flex: 1, backgroundColor: t.bg }}><Loading /></View>;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const addPhotos = async () => {
    try {
      const imgs = await pickImages({ max: MAX_PH - photos.length });
      if (imgs.length) setPhotos((p) => [...p, ...imgs].slice(0, MAX_PH));
    } catch (e) { toast(e.message); }
  };
  const makeCover = (i) => setPhotos((p) => [p[i], ...p.filter((_, j) => j !== i)]);

  const save = async () => {
    const e = {};
    const price = parseFloat(String(f.price).replace(/[^\d.]/g, '')) || 0;
    if (f.title.trim().length < 5) e.title = "Sarlavha kamida 5 ta belgidan iborat bo'lsin.";
    if (!price && !f.negotiable) e.price = 'Narxni kiriting yoki "Kelishiladi"ni belgilang.';
    if (!f.region) e.region = 'Hududni tanlang.';
    if (f.description.trim().length < 20) e.description = 'Tavsifni batafsilroq yozing (kamida 20 ta belgi).';
    if (f.seller_name.trim().length < 2) e.seller_name = 'Ism yoki studiya nomini kiriting.';
    if (String(f.phone).replace(/\D/g, '').length < 9) e.phone = "Telefon raqamini to'liq kiriting.";
    const bad = checkText(f.title + ' ' + f.description);
    if (bad) e.description = bad;
    setErrs(e);
    if (Object.keys(e).length) { toast("Xatolarni to'g'rilang"); return; }

    const row = {
      kind: f.kind, title: f.title.trim(), cat: f.cat, price, cur: f.cur, unit: f.unit, price_from: f.price_from, negotiable: f.negotiable,
      region: f.region, district: f.district || '', exp_years: String(f.exp_years || ''), description: f.description.trim(),
      seller_name: f.seller_name.trim(), phone: f.phone.trim(),
    };
    try {
      setSaving('Saqlanmoqda…');
      let adId = id;
      if (!adId) {
        const { data, error } = await supabase.from('ads').insert(row).select('id').single();
        if (error) throw error;
        adId = data.id;
      } else {
        const { error } = await supabase.from('ads').update(row).eq('id', adId);
        if (error) throw error;
      }
      const paths = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.path) { paths.push(p.path); continue; }
        setSaving(`Rasm ${i + 1}/${photos.length}…`);
        paths.push(await uploadImage('ads', `${uid}/${adId}/${newName()}`, p));
      }
      const { error: e2 } = await supabase.from('ads').update({ photos: paths }).eq('id', adId);
      if (e2) throw e2;
      toast(id ? "E'lon yangilandi" : "E'lon joylandi 🎉");
      router.replace(`/ad/${adId}`);
    } catch (err) {
      toast(errText(err));
      setErrs((x) => ({ ...x, form: errText(err) }));
    } finally { setSaving(''); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: id ? "E'lonni tahrirlash" : "Yangi e'lon" }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <Seg value={f.kind} onChange={set('kind')} options={[['xizmat', 'Xizmat taklif qilaman'], ['buyurtma', 'Ijodkor qidiryapman']]} />

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink }}>Rasmlar <Text style={{ color: t.muted, fontWeight: '400' }}>· {MAX_PH} tagacha, birinchisi muqova</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {photos.map((p, i) => (
              <View key={(p.path || p.uri) + i} style={{ width: 100, height: 100, borderRadius: 12, overflow: 'hidden', backgroundColor: t.chip }}>
                <Image source={{ uri: p.path ? publicUrl('ads', p.path) : p.uri }} style={{ width: 100, height: 100 }} contentFit="cover" />
                <Pressable onPress={() => setPhotos((x) => x.filter((_, j) => j !== i))} hitSlop={6} style={{ position: 'absolute', right: 4, top: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
                <Pressable onPress={() => makeCover(i)} style={{ position: 'absolute', left: 4, bottom: 4, borderRadius: 6, backgroundColor: i === 0 ? t.accent : 'rgba(0,0,0,.6)', paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: i === 0 ? t.accentInk : '#fff', fontSize: 10, fontWeight: '800' }}>{i === 0 ? 'MUQOVA' : 'MUQOVA QILISH'}</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PH ? (
              <Pressable onPress={addPhotos} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Ionicons name="camera-outline" size={24} color={t.muted} />
                <Text style={{ fontSize: 12, color: t.muted, fontWeight: '600' }}>Rasm qo'shish</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Field label="Sarlavha" value={f.title} onChangeText={set('title')} maxLength={80} placeholder="Masalan: Instagram uchun Reels montaj" error={errs.title} hint={`${f.title.length} / 80`} />
        <Select label="Kategoriya" value={catOf(f.cat).n} onPress={() => setPicker('cat')} />

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field style={{ flex: 1.4 }} label="Narx" value={String(f.price)} onChangeText={(v) => set('price')(fmtNum(v.replace(/\D/g, '')) === '0' ? '' : fmtNum(v.replace(/\D/g, '')))} keyboardType="number-pad" placeholder="Narx" error={errs.price} />
            <View style={{ flex: 0.9 }}><Select label="Valyuta" value={f.cur === 'usd' ? '$' : "so'm"} onPress={() => setPicker('cur')} /></View>
            <View style={{ flex: 1 }}><Select label="Birlik" value={UNITS[f.unit]} onPress={() => setPicker('unit')} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            <Check label='"...dan" narx' value={f.price_from} onChange={set('price_from')} />
            <Check label="Kelishiladi" value={f.negotiable} onChange={set('negotiable')} />
          </View>
        </View>

        <Select label="Hudud" value={f.region ? (f.region === ONLINE ? "Onlayn (butun O'zbekiston)" : (f.district ? f.district + ', ' : '') + shortReg(f.region)) : ''} placeholder="Viloyat va tumanni tanlang" onPress={() => setPicker('region')} error={errs.region} />
        <Field label="Tajriba (yil)" value={String(f.exp_years || '')} onChangeText={set('exp_years')} keyboardType="decimal-pad" maxLength={4} placeholder="Masalan: 2" />
        <Field label="Tavsif" value={f.description} onChangeText={set('description')} multiline maxLength={3000}
          placeholder="Nima qilasiz, paketga nima kiradi, muddatlar…" error={errs.description} hint={`${f.description.length} / 3000`} />
        <Field label="Ism yoki studiya nomi" value={f.seller_name} onChangeText={set('seller_name')} maxLength={60} error={errs.seller_name} />
        <Field label="Telefon raqami" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={20} placeholder="+998 90 123 45 67" error={errs.phone} hint="Mijozlar asosan ilova ichidagi chat orqali yozadi." />

        <Note>E'lonlar avtomatik tekshiriladi: faqat SMM, montaj, dizayn, marketing va boshqa ijodiy xizmatlar qabul qilinadi. Telegram, Instagram yoki WhatsApp manzillarini yozib bo'lmaydi.</Note>
        {errs.form ? <Note kind="bad">{errs.form}</Note> : null}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: ins.bottom + 12, borderTopWidth: 1, borderColor: t.line, backgroundColor: t.bg }}>
        <Btn title={saving || (id ? 'Saqlash' : 'Joylash')} loading={!!saving} onPress={save} style={{ maxWidth: 608, width: '100%', alignSelf: 'center' }} />
      </View>

      <ListPicker visible={picker === 'cat'} onClose={() => setPicker(null)} title="Kategoriya" value={f.cat} onPick={set('cat')} items={CATS.map((c) => [c.id, c.n])} />
      <ListPicker visible={picker === 'cur'} onClose={() => setPicker(null)} title="Valyuta" value={f.cur} onPick={set('cur')} items={[['uzs', "so'm"], ['usd', 'AQSH dollari ($)']]} />
      <ListPicker visible={picker === 'unit'} onClose={() => setPicker(null)} title="Narx birligi" value={f.unit} onPick={set('unit')} items={Object.entries(UNITS)} />
      <RegionPicker visible={picker === 'region'} onClose={() => setPicker(null)} current={f}
        onPick={(r, d) => { setF((x) => ({ ...x, region: r, district: d })); setPicker(null); }} />
    </KeyboardAvoidingView>
  );
}
