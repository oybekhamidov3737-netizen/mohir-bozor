import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase, adPhoto, errText } from '../../src/supabase';
import { fetchProfiles } from '../../src/api';
import { dayLabel, priceText, timeOnly, seenText, isOnline } from '../../src/format';
import { Cover, FadeIn, Loading, Note } from '../../src/ui';
import { Stars } from '../../src/lists';
import { LinearGradient } from 'expo-linear-gradient';
import { tr } from '../../src/i18n';

const Bubble = ({ colors, start, end, style, children }) => (colors ? <LinearGradient colors={colors} start={start} end={end} style={style}>{children}</LinearGradient> : <View style={style}>{children}</View>);
// Til almashganda qayta hisoblanishi uchun funksiya
const QUICK = () => [tr("Assalomu alaykum! E'loningiz hali dolzarbmi?"), tr("Narxi kelishiladimi?"), tr("Portfolio yubora olasizmi?"), tr("Qachon boshlay olasiz?")];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { uid, isAdmin, toast, loadUnread } = useApp();
  const [th, setTh] = useState(null);
  const [profs, setProfs] = useState({});
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const list = useRef(null);
  const [menu, setMenu] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [stars, setStars] = useState(0);
  const [rText, setRText] = useState('');
  const [rBusy, setRBusy] = useState(false);
  useEffect(() => {
    if (!uid) return;
    supabase.from('reviews').select('*').eq('thread_id', id).eq('author_id', uid).maybeSingle().then(({ data }) => {
      if (data) { setMyReview(data); setStars(data.stars); setRText(data.body || ''); }
    });
  }, [id, uid]);
  const saveReview = async () => {
    if (!stars) { toast(tr('Yulduzchani tanlang')); return; }
    setRBusy(true);
    const row = { thread_id: id, stars, body: rText.trim().slice(0, 500) };
    const { data, error } = myReview
      ? await supabase.from('reviews').update({ stars: row.stars, body: row.body }).eq('id', myReview.id).select().single()
      : await supabase.from('reviews').insert(row).select().single();
    setRBusy(false);
    if (error) { toast(errText(error)); return; }
    setMyReview(data); setRateOpen(false); toast(tr('Rahmat! Bahoyingiz saqlandi'));
  };
  const [blocked, setBlocked] = useState(false);

  const markRead = useCallback(() => { supabase.rpc('mark_read', { p_thread: id }).then(() => loadUnread()); }, [id, loadUnread]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: tr } = await supabase.from('threads').select('*, ads(id,title,photos,cat,price,cur,unit,price_from,negotiable,user_id)').eq('id', id).maybeSingle();
      if (!alive) return;
      if (!tr) { toast(tr("Suhbat topilmadi")); router.back(); return; }
      setTh(tr);
      setProfs(await fetchProfiles([tr.buyer_id, tr.seller_id]));
      const oth = uid === tr.buyer_id ? tr.seller_id : tr.buyer_id;
      if (uid && oth) {
        const { data: b } = await supabase.from('blocks').select('blocked').eq('blocker', uid).eq('blocked', oth).maybeSingle();
        if (alive) setBlocked(!!b);
      }
      const { data } = await supabase.from('messages').select('*').eq('thread_id', id).order('id', { ascending: true }).limit(500);
      if (!alive) return;
      setMsgs(data || []);
      markRead();
    })();
    const ch = supabase.channel('chat-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${id}` }, (p) => {
        setMsgs((m) => (m && !m.some((x) => x.id === p.new.id) ? [...m.filter((x) => !(x._tmp && x.body === p.new.body && x.sender_id === p.new.sender_id)), p.new] : m));
        markRead();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads', filter: `id=eq.${id}` }, (p) => {
        setTh((cur) => (cur ? { ...cur, ...p.new, ads: cur.ads } : cur));
      })
      .subscribe();
    // Suhbatdoshning onlayn holatini yangilab turish
    const iv = setInterval(async () => {
      const { data: tr } = await supabase.from('threads').select('buyer_id,seller_id,buyer_read_at,seller_read_at').eq('id', id).maybeSingle();
      if (!alive || !tr) return;
      setTh((cur) => (cur ? { ...cur, buyer_read_at: tr.buyer_read_at, seller_read_at: tr.seller_read_at } : cur));
      setProfs(await fetchProfiles([tr.buyer_id, tr.seller_id]));
    }, 30000);
    return () => { alive = false; clearInterval(iv); supabase.removeChannel(ch); };
  }, [id]);

  if (!th || !msgs) return <View style={{ flex: 1, backgroundColor: t.bg }}><Loading /></View>;

  const member = uid === th.buyer_id || uid === th.seller_id;
  const otherId = uid === th.buyer_id ? th.seller_id : th.buyer_id;
  const support = !th.ad_id;
  const otherReadAt = uid === th.buyer_id ? th.seller_read_at : th.buyer_read_at;
  const title = support ? (uid === th.buyer_id ? tr("Qo'llab-quvvatlash") : tr('Murojaat: {0}', profs[th.buyer_id]?.name || tr('Foydalanuvchi'))) : member ? profs[otherId]?.name || tr('Suhbat') : `${profs[th.seller_id]?.name || tr('Sotuvchi')} ↔ ${profs[th.buyer_id]?.name || tr('Xaridor')}`;
  const img = adPhoto(th.ads);

  const send = async (body) => {
    const b = (body ?? text).trim();
    if (!b || sending) return;
    setSending(true);
    const tmp = { id: 'tmp' + Date.now(), _tmp: true, sender_id: uid, body: b, created_at: new Date().toISOString() };
    setMsgs((m) => [...m, tmp]);
    setText('');
    const { data, error } = await supabase.from('messages').insert({ thread_id: id, body: b }).select().single();
    setSending(false);
    if (error) {
      toast(errText(error));
      setMsgs((m) => m.filter((x) => x.id !== tmp.id));
      setText(b);
      return;
    }
    setMsgs((m) => (m.some((x) => x.id === data.id) ? m.filter((x) => x.id !== tmp.id) : m.map((x) => (x.id === tmp.id ? data : x))));
  };

  const toggleBlock = async () => {
    setMenu(false);
    const { error } = blocked
      ? await supabase.from('blocks').delete().eq('blocker', uid).eq('blocked', otherId)
      : await supabase.from('blocks').insert({ blocked: otherId });
    if (error) { toast(errText(error)); return; }
    setBlocked(!blocked);
    toast(blocked ? tr("Blokdan chiqarildi") : tr("Foydalanuvchi bloklandi. U sizga yoza olmaydi."));
  };
  const reportUser = async () => {
    setMenu(false);
    const { error } = await supabase.from('reports').insert({ ad_id: th.ad_id, reason: 'offensive', note: 'Chatdagi xatti-harakat: ' + (profs[otherId]?.name || otherId) });
    if (error && /duplicate|unique/i.test(error.message)) { toast(tr("Siz allaqachon shikoyat qilgansiz")); return; }
    if (error) { toast(errText(error)); return; }
    toast(tr("Shikoyat yuborildi. 24 soat ichida tekshiramiz."));
  };

  const rows = [];
  let lastDay = '';
  msgs.forEach((m) => {
    const d = dayLabel(m.created_at);
    if (d !== lastDay) { rows.push({ day: d, key: 'd' + m.id }); lastDay = d; }
    rows.push({ m, key: String(m.id) });
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen options={{
        headerTitle: () => (
          <View style={{ alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start' }}>
            <Text style={{ color: t.ink, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{title}</Text>
            {member && !support && profs[otherId]?.last_seen ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {isOnline(profs[otherId].last_seen) ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.price }} /> : null}
                <Text style={{ color: isOnline(profs[otherId].last_seen) ? t.price : t.muted, fontSize: 12 }}>{seenText(profs[otherId].last_seen)}</Text>
              </View>
            ) : null}
          </View>
        ),
        headerRight: member && !support ? () => (
          <Pressable onPress={() => setMenu((v) => !v)} hitSlop={10} accessibilityLabel={tr("Boshqa amallar")} style={{ paddingHorizontal: 8 }}>
            <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={t.ink} />
          </Pressable>
        ) : undefined,
      }} />
      {menu ? (
        <View style={{ margin: 12, marginBottom: 0, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12, overflow: 'hidden' }}>
          <Pressable onPress={() => { setMenu(false); router.push(`/u/${otherId}`); }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: t.line }}>
            <Ionicons name="person-circle-outline" size={18} color={t.ink} /><Text style={{ color: t.ink, fontSize: 15 }}>{tr('Profilini ko\'rish')}</Text>
          </Pressable>
          <Pressable onPress={() => { setMenu(false); setRateOpen(true); }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: t.line }}>
            <Ionicons name="star-outline" size={18} color="#F5A623" /><Text style={{ color: t.ink, fontSize: 15 }}>{myReview ? tr('Bahoni o\'zgartirish') : tr('Baho qoldirish')}</Text>
          </Pressable>
          <Pressable onPress={reportUser} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: t.line }}>
            <Ionicons name="flag-outline" size={18} color={t.ink} /><Text style={{ color: t.ink, fontSize: 15 }}>{tr("Shikoyat qilish")}</Text>
          </Pressable>
          <Pressable onPress={toggleBlock} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14 }}>
            <Ionicons name={blocked ? 'lock-open-outline' : 'ban-outline'} size={18} color={t.danger} /><Text style={{ color: t.danger, fontSize: 15 }}>{blocked ? tr("Blokdan chiqarish") : tr("Foydalanuvchini bloklash")}</Text>
          </Pressable>
        </View>
      ) : null}
      {rateOpen ? (
        <View style={{ margin: 12, marginBottom: 0, backgroundColor: t.surface, borderRadius: 18, padding: 16, gap: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#F5A623' }}>
          <Text style={{ color: t.ink, fontWeight: '800', fontSize: 16 }}>{tr('{0}ga baho bering', profs[otherId]?.name || tr('Foydalanuvchi'))}</Text>
          <Stars value={stars} size={36} onPick={setStars} />
          <TextInput value={rText} onChangeText={setRText} placeholder={tr('Izoh (ixtiyoriy): ish sifati, muddat, muomala…')} placeholderTextColor={t.muted} multiline maxLength={500}
            style={{ alignSelf: 'stretch', minHeight: 70, borderRadius: 14, backgroundColor: t.chip, color: t.ink, padding: 12, fontSize: 15, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <Pressable onPress={() => setRateOpen(false)} style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.ink, fontWeight: '700' }}>{tr('Bekor qilish')}</Text></Pressable>
            <Pressable onPress={saveReview} disabled={rBusy} style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center', opacity: rBusy ? 0.6 : 1 }}><Text style={{ color: '#1A1405', fontWeight: '800' }}>{tr('Saqlash')}</Text></Pressable>
          </View>
        </View>
      ) : null}
      {th.ads ? (
        <Pressable onPress={() => router.push(`/ad/${th.ads.id}`)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', margin: 12, marginBottom: 0, padding: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', backgroundColor: t.chip }}>
            {img ? <Image source={{ uri: img }} style={{ width: 44, height: 44 }} /> : <Cover cat={th.ads.cat} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: t.ink, fontSize: 13 }} numberOfLines={1}>{th.ads.title}</Text>
            <Text style={{ color: t.price, fontWeight: '800', fontSize: 13 }}>{priceText(th.ads)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={t.muted} />
        </Pressable>
      ) : null}
      {support && uid === th.buyer_id ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 12 }}><Note>{tr("Mohir bozor jamoasi. Savolingizni yozing, odatda bir necha soat ichida javob beramiz.")}</Note></View>
      ) : null}
      {!member && isAdmin ? <View style={{ paddingHorizontal: 12 }}><Note kind="gold">{tr("Siz bu suhbatni moderator sifatida faqat o'qiyapsiz.")}</Note></View> : null}
      <FlatList
        ref={list}
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ padding: 12, gap: 6, flexGrow: 1, maxWidth: 760, width: '100%', alignSelf: 'center' }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          if (item.day) return <Text style={{ alignSelf: 'center', fontSize: 11, color: t.muted, backgroundColor: t.chip, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 6, overflow: 'hidden' }}>{item.day}</Text>;
          const m = item.m;
          const me = member ? m.sender_id === uid : m.sender_id === th.buyer_id;
          return (
            <FadeIn index={0} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <Bubble {...(me ? { colors: ['#5A7BFF', '#2747D6'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } : {})} style={{ backgroundColor: me ? t.accent : t.surface, borderRadius: 20, borderBottomRightRadius: me ? 6 : 20, borderBottomLeftRadius: me ? 20 : 6, paddingHorizontal: 13, paddingTop: 9, paddingBottom: 6, opacity: m._tmp ? 0.6 : 1,
              ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }) }}>
              {!member ? <Text style={{ fontSize: 11, fontWeight: '700', color: me ? '#fff' : t.muted, opacity: 0.8 }}>{profs[m.sender_id]?.name || ''}</Text> : null}
              <Text selectable style={{ color: me ? '#fff' : t.ink, fontSize: 15, lineHeight: 21 }}>{m.body}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', marginTop: 2 }}>
                <Text style={{ color: me ? '#fff' : t.muted, fontSize: 10, opacity: 0.75 }}>{timeOnly(m.created_at)}</Text>
                {me && member ? (
                  m._tmp ? <Ionicons name="time-outline" size={12} color="#fff" style={{ opacity: 0.75 }} />
                    : otherReadAt && Date.parse(m.created_at) <= Date.parse(otherReadAt)
                      ? <Ionicons name="checkmark-done" size={15} color="#fff" accessibilityLabel={tr("O'qildi")} />
                      : <Ionicons name="checkmark" size={14} color="#fff" style={{ opacity: 0.75 }} accessibilityLabel={tr("Yetkazildi")} />
                ) : null}
              </View>
            </Bubble>
            </FadeIn>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: t.muted, marginTop: 40 }}>{support ? tr("Savolingizni yozing.") : tr("Savolingizni yozing, sotuvchi javob beradi.")}</Text>}
      />
      {member && blocked && !support ? (
        <View style={{ padding: 12, paddingBottom: ins.bottom + 12 }}><Note kind="bad">{tr("Siz bu foydalanuvchini bloklagansiz. Yozish uchun \"…\" menyusidan blokdan chiqaring.")}</Note></View>
      ) : member ? (
        <View style={{ borderTopWidth: 1, borderColor: t.line, backgroundColor: t.surface, paddingHorizontal: 12, paddingTop: 8, paddingBottom: ins.bottom + 8 }}>
          {!msgs.length && !support ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {QUICK().map((q) => (
                <Pressable key={q} onPress={() => send(q)} style={{ borderWidth: 1, borderColor: t.line, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, color: t.ink }}>{q}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: 736, width: '100%', alignSelf: 'center' }}>
            <TextInput value={text} onChangeText={setText} placeholder={tr("Xabar yozing…")} placeholderTextColor={t.muted} multiline maxLength={2000}
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 0, borderColor: t.line, backgroundColor: t.chip, color: t.ink, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 16 }} />
            <Pressable onPress={() => send()} disabled={!text.trim() || sending} accessibilityLabel={tr("Yuborish")}
              style={({ pressed }) => ({ opacity: text.trim() ? 1 : 0.5, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
              <LinearGradient colors={['#5A7BFF', '#2747D6']} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="send" size={19} color="#fff" style={{ marginLeft: 2 }} />
              </LinearGradient>
            </Pressable>
          </View>
          <Text style={{ fontSize: 10, color: t.muted, textAlign: 'center', marginTop: 6 }}>{tr("Xavfsizlik uchun suhbatni ma'muriyat ko'rishi mumkin.")}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
