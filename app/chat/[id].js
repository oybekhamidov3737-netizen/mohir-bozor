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
import { Cover, Loading, Note } from '../../src/ui';

const QUICK = ["Assalomu alaykum! E'loningiz hali dolzarbmi?", 'Narxi kelishiladimi?', 'Portfolio yubora olasizmi?', 'Qachon boshlay olasiz?'];

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

  const markRead = useCallback(() => { supabase.rpc('mark_read', { p_thread: id }).then(() => loadUnread()); }, [id, loadUnread]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: tr } = await supabase.from('threads').select('*, ads(id,title,photos,cat,price,cur,unit,price_from,negotiable,user_id)').eq('id', id).maybeSingle();
      if (!alive) return;
      if (!tr) { toast('Suhbat topilmadi'); router.back(); return; }
      setTh(tr);
      setProfs(await fetchProfiles([tr.buyer_id, tr.seller_id]));
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
  const title = support ? (uid === th.buyer_id ? "Qo'llab-quvvatlash" : `Murojaat: ${profs[th.buyer_id]?.name || 'Foydalanuvchi'}`) : member ? profs[otherId]?.name || 'Suhbat' : `${profs[th.seller_id]?.name || 'Sotuvchi'} ↔ ${profs[th.buyer_id]?.name || 'Xaridor'}`;
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
      }} />
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
        <View style={{ paddingHorizontal: 12, paddingTop: 12 }}><Note>Mohir bozor jamoasi. Savolingizni yozing, odatda bir necha soat ichida javob beramiz.</Note></View>
      ) : null}
      {!member && isAdmin ? <View style={{ paddingHorizontal: 12 }}><Note kind="gold">Siz bu suhbatni moderator sifatida faqat o'qiyapsiz.</Note></View> : null}
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
            <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '80%', backgroundColor: me ? t.accent : t.surface, borderWidth: me ? 0 : 1, borderColor: t.line, borderRadius: 16, borderBottomRightRadius: me ? 5 : 16, borderBottomLeftRadius: me ? 16 : 5, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 5, opacity: m._tmp ? 0.6 : 1 }}>
              {!member ? <Text style={{ fontSize: 11, fontWeight: '700', color: me ? t.accentInk : t.muted, opacity: 0.8 }}>{profs[m.sender_id]?.name || ''}</Text> : null}
              <Text selectable style={{ color: me ? t.accentInk : t.ink, fontSize: 15, lineHeight: 21 }}>{m.body}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', marginTop: 2 }}>
                <Text style={{ color: me ? t.accentInk : t.muted, fontSize: 10, opacity: 0.75 }}>{timeOnly(m.created_at)}</Text>
                {me && member ? (
                  m._tmp ? <Ionicons name="time-outline" size={12} color={t.accentInk} style={{ opacity: 0.75 }} />
                    : otherReadAt && Date.parse(m.created_at) <= Date.parse(otherReadAt)
                      ? <Ionicons name="checkmark-done" size={15} color={t.accentInk} accessibilityLabel="O'qildi" />
                      : <Ionicons name="checkmark" size={14} color={t.accentInk} style={{ opacity: 0.75 }} accessibilityLabel="Yetkazildi" />
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: t.muted, marginTop: 40 }}>{support ? 'Savolingizni yozing.' : 'Savolingizni yozing, sotuvchi javob beradi.'}</Text>}
      />
      {member ? (
        <View style={{ borderTopWidth: 1, borderColor: t.line, backgroundColor: t.surface, paddingHorizontal: 12, paddingTop: 8, paddingBottom: ins.bottom + 8 }}>
          {!msgs.length && !support ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {QUICK.map((q) => (
                <Pressable key={q} onPress={() => send(q)} style={{ borderWidth: 1, borderColor: t.line, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, color: t.ink }}>{q}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: 736, width: '100%', alignSelf: 'center' }}>
            <TextInput value={text} onChangeText={setText} placeholder="Xabar yozing…" placeholderTextColor={t.muted} multiline maxLength={2000}
              style={{ flex: 1, minHeight: 42, maxHeight: 120, borderRadius: 21, borderWidth: 1, borderColor: t.line, backgroundColor: t.bg, color: t.ink, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 16 }} />
            <Pressable onPress={() => send()} disabled={!text.trim() || sending} accessibilityLabel="Yuborish"
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', opacity: text.trim() ? 1 : 0.5 }}>
              <Ionicons name="arrow-up" size={22} color={t.accentInk} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 10, color: t.muted, textAlign: 'center', marginTop: 6 }}>Xavfsizlik uchun suhbatni ma'muriyat ko'rishi mumkin.</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
