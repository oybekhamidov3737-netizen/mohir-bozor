// To'lov tugmalari: oq fonda rasmiy logotiplar (Payme: cdn.payme.uz, Click: click.uz/click/images/logo.svg)
import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Press } from './ui';

function LogoButton({ onPress, loading, label, logo, size, name }) {
  return (
    <Press onPress={onPress} disabled={loading} accessibilityLabel={name} style={{
      height: 54, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D9DEE3',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 18,
    }}>
      {loading ? <ActivityIndicator color="#0A1F2B" /> : (
        <>
          <Image source={logo} style={size} resizeMode="contain" />
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

export function PaymeButton(props) {
  return <LogoButton {...props} name="Payme" logo={require('../assets/payme-logo.png')} size={{ width: 91, height: 30 }} />;
}

export function ClickButton(props) {
  return <LogoButton {...props} name="Click" logo={require('../assets/click-logo.png')} size={{ width: 98, height: 25 }} />;
}
