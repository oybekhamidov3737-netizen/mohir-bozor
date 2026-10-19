// Payme to'lov tugmasi: oq fonda rasmiy Payme logotipi (cdn.payme.uz/logo/payme_color.svg dan)
import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Press } from './ui';

export function PaymeButton({ onPress, loading, label }) {
  return (
    <Press onPress={onPress} disabled={loading} accessibilityLabel="Payme" style={{
      height: 54, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D9DEE3',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 18,
    }}>
      {loading ? <ActivityIndicator color="#0A1F2B" /> : (
        <>
          <Image source={require('../assets/payme-logo.png')} style={{ width: 91, height: 30 }} resizeMode="contain" />
          {label ? (
            <View style={{ flexShrink: 1 }}>
              <Text style={{ color: '#0A1F2B', fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{label}</Text>
            </View>
          ) : null}
        </>
      )}
    </Press>
  );
}
