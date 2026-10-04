import React, { useCallback, useState } from 'react';
import { Platform, Share, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { copyText } from './copy';
import { useT, FONT } from './theme';
import { useApp } from './app-context';
import { supabase, errText } from './supabase';
import { fmtNum } from './format';
import { refLink, cleanRef } from './referral';
import { Btn } from './ui';
import { tr } from './i18n';

// Kabinetdagi "Do'stlarni taklif qiling" kartasi
export function InviteCard() {
  const t = useT();
  const { uid, config, profile, toast } = useApp();
  const [st, setSt] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!uid) return;
    supabase.rpc('my_referrals').then(({ data, error }) => {
      if (data && data.code) setSt(data);
      else if (profile?.ref_code) setSt({ code: profile.ref_code, bonus: 0, invited: 0, active: 0, referred: !!profile.referred_by });
      else if (error) setSt(null);
    });
  }, [uid, profile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!st || !st.code) return null;
  const link = refLink(st.code);
  const inv = config.ref_bonus_inviter ?? 10000, new_ = config.ref_bonus_invitee ?? 5000;

  const share = async () => {
    const msg = `Mohir bozor — SMM, montaj, dizayn va marketing ustalari bozori. Shu havola orqali ro'yxatdan o'tsang, ${fmtNum(new_)} so'm bonus olasan:\n${link}`;
    try {
      if (Platform.OS === 'web' && !navigator.share) { copyText(msg).then((ok) => ok && toast(tr("Taklif matni nusxalandi"))); return; }
      await Share.share(Platform.OS === 'ios' ? { message: msg, url: link } : { message: msg });
    } catch (e) {}
  };
  const copy = (v, m) => { copyText(v).then((ok) => toast(ok ? m : tr("Nusxalab bo'lmadi"))); };
  const apply = async () => {
    const c = cleanRef(code);
    if (c.length < 4) { toast(tr("Taklif kodini kiriting")); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('claim_referral', { p_code: c });
    setBusy(false);
    if (error) { toast(errText(error)); return; }
    toast(tr("Kod qo'llandi: +{0} so'm bonus", fmtNum(data?.bonus || 0))); setCode(''); load();
  };

  const stat = (n, l) => (
    <View style={{ flex: 1, backgroundColor: t.surface, borderRadius: 12, padding: 10, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: t.ink }}>{n}</Text>
      <Text style={{ fontSize: 11, color: t.muted, textAlign: 'center' }}>{l}</Text>
    </View>
  );

  return (
    <View style={{ marginTop: 14, backgroundColor: t.goldSoft, borderRadius: 18, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Ionicons name="gift" size={26} color={t.gold} />
        <Text style={{ flex: 1, fontFamily: FONT.displayM, fontSize: 17, color: t.ink }}>{tr("Do'stlarni taklif qiling")}</Text>
      </View>
      <Text style={{ color: t.ink, lineHeight: 20 }}>
        {tr("Do'stingiz havolangiz orqali ro'yxatdan o'tsa, unga")}{' '}<Text style={{ fontWeight: '800' }}>{fmtNum(new_)} {tr("so'm")}</Text>{tr(", birinchi e'lonini joylaganda sizga")}{' '}<Text style={{ fontWeight: '800' }}>{fmtNum(inv)} {tr("so'm")}</Text> {tr("bonus beriladi. Bonus TOP, VIP va boshqa xizmatlarga sarflanadi.")}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stat(fmtNum(st.earned || 0) + tr(" so'm"), tr("Taklifdan topilgan"))}
        {stat(st.invited, tr("Taklif qilinganlar"))}
        {stat(st.active, tr("Faol do'stlar"))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surface, borderRadius: 12, padding: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: t.muted }}>{tr("Taklif kodingiz")}</Text>
          <Text selectable style={{ fontSize: 22, fontWeight: '800', letterSpacing: 3, color: t.ink }}>{st.code}</Text>
        </View>
        <Btn small kind="sec" icon="copy-outline" title={tr("Havola")} onPress={() => copy(link, tr("Havola nusxalandi"))} />
      </View>
      <Btn kind="gold" icon="share-social-outline" title={tr("Taklif yuborish")} onPress={share} />
      {!st.referred ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, color: t.muted }}>{tr("Sizni kimdir taklif qilganmi? Kodini kiriting (ro'yxatdan o'tgandan keyin 7 kun ichida):")}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={code} onChangeText={(v) => setCode(cleanRef(v))} placeholder={tr("KOD")} placeholderTextColor={t.muted} autoCapitalize="characters"
              style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, color: t.ink, paddingHorizontal: 12, fontSize: 16, letterSpacing: 2 }} />
            <Btn small title={tr("Qo'llash")} onPress={apply} loading={busy} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
