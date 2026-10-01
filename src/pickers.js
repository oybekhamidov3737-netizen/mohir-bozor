import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from './theme';
import { ONLINE, REGIONS, REG_NAMES } from './data';
import { shortReg } from './format';

function Sheet({ visible, onClose, title, onBack, children }) {
  const t = useT();
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(10,14,12,.45)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%', paddingBottom: ins.bottom + 10, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
            {onBack ? <Pressable onPress={onBack} hitSlop={10}><Ionicons name="chevron-back" size={24} color={t.ink} /></Pressable> : null}
            <Text style={{ flex: 1, fontFamily: FONT.displayM, fontSize: 16, color: t.ink }} numberOfLines={1}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Yopish"><Ionicons name="close" size={24} color={t.ink} /></Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function Row({ title, right, selected, onPress, chevron }) {
  const t = useT();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: t.line, backgroundColor: pressed ? t.chip : t.surface })}>
      <Text style={{ flex: 1, fontSize: 15, color: selected ? t.accent : t.ink, fontWeight: selected ? '700' : '500' }}>{title}</Text>
      {right != null ? <Text style={{ color: t.muted, fontSize: 12, marginRight: 6 }}>{right}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={t.muted} /> : null}
    </Pressable>
  );
}

// Viloyat → tuman tanlash
export function RegionPicker({ visible, onClose, onPick, allowAll, allowOnline = true, current }) {
  const [reg, setReg] = useState(null);
  const close = () => { setReg(null); onClose(); };
  const pick = (r, d) => { setReg(null); onPick(r, d); };
  if (!reg) {
    const items = [
      ...(allowAll ? [{ k: '__all', title: "Butun O'zbekiston" }] : []),
      ...(allowOnline ? [{ k: ONLINE, title: "Onlayn (masofadan)" }] : []),
      ...REG_NAMES.map((r) => ({ k: r, title: r, chevron: true })),
    ];
    return (
      <Sheet visible={visible} onClose={close} title="Hududni tanlang">
        <FlatList data={items} keyExtractor={(i) => i.k} renderItem={({ item }) => (
          <Row title={item.title} chevron={item.chevron} selected={current?.region === item.k || (item.k === '__all' && !current?.region)}
            onPress={() => item.k === '__all' ? pick('', '') : item.k === ONLINE ? pick(ONLINE, '') : setReg(item.k)} />
        )} />
      </Sheet>
    );
  }
  return (
    <Sheet visible={visible} onClose={close} title={reg} onBack={() => setReg(null)}>
      <FlatList data={['', ...REGIONS[reg]]} keyExtractor={(i) => i || '__whole'} renderItem={({ item }) => (
        <Row title={item || `Butun ${shortReg(reg)}`} selected={current?.region === reg && (current?.district || '') === item} onPress={() => pick(reg, item)} />
      )} />
    </Sheet>
  );
}

// Oddiy ro'yxatdan tanlash
export function ListPicker({ visible, onClose, title, items, value, onPick }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <FlatList data={items} keyExtractor={(i) => String(i[0])} renderItem={({ item }) => (
        <Row title={item[1]} selected={item[0] === value} onPress={() => { onPick(item[0]); onClose(); }} />
      )} />
    </Sheet>
  );
}
