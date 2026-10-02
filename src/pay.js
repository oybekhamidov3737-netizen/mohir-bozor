import { Linking, Platform } from 'react-native';
import { WEB_URL } from './config';

const b64 = (str) => (typeof btoa === 'function' ? btoa(str) : globalThis.Buffer.from(str).toString('base64'));

// Payme yoki Click to'lov sahifasining manzili
export function onlinePayUrl(provider, order, config) {
  const back = WEB_URL + '/cabinet';
  if (provider === 'payme') {
    const base = config.payme_test ? 'https://checkout.test.paycom.uz/' : 'https://checkout.paycom.uz/';
    return base + b64(`m=${config.payme_merchant_id};ac.order_id=${order.id};a=${Math.round(+order.price * 100)};c=${back};l=uz`);
  }
  return 'https://my.click.uz/services/pay?' + new URLSearchParams({
    service_id: config.click_service_id, merchant_id: config.click_merchant_id,
    amount: String(+order.price), transaction_param: order.id, return_url: back,
  }).toString();
}

export async function openPay(url) {
  if (Platform.OS === 'web') window.location.href = url;
  else await Linking.openURL(url);
}

export const hasPayme = (c) => !!c.payme_merchant_id;
export const hasClick = (c) => !!(c.click_service_id && c.click_merchant_id);
