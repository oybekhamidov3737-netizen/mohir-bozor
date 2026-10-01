export const CATS = [
  { id: 'smm', n: 'SMM', big: 'SMM', c: 0, icon: 'phone-portrait-outline' },
  { id: 'montaj', n: 'Video montaj', big: 'MONTAJ', c: 1, icon: 'film-outline' },
  { id: 'mobilo', n: 'Mobilografiya', big: 'MOBILOGRAFIYA', c: 2, icon: 'videocam-outline' },
  { id: 'target', n: 'Target reklama', big: 'TARGET', c: 3, icon: 'locate-outline' },
  { id: 'dizayn', n: 'Grafik dizayn', big: 'DIZAYN', c: 4, icon: 'color-palette-outline' },
  { id: 'motion', n: 'Motion dizayn', big: 'MOTION', c: 5, icon: 'play-circle-outline' },
  { id: 'kopi', n: 'Kopirayting', big: 'MATN', c: 0, icon: 'document-text-outline' },
  { id: 'foto', n: 'Fotograf', big: 'FOTO', c: 2, icon: 'camera-outline' },
  { id: 'strat', n: 'Marketing', big: 'MARKETING', c: 1, icon: 'trending-up-outline' },
  { id: 'sayt', n: 'Veb-sayt', big: 'SAYT', c: 4, icon: 'globe-outline' },
  { id: 'ovoz', n: 'Ovoz, dublyaj', big: 'OVOZ', c: 3, icon: 'mic-outline' },
  { id: 'bloger', n: 'Bloger, reklama', big: 'BLOGER', c: 5, icon: 'star-outline' },
];
export const catOf = (id) => CATS.find((c) => c.id === id) || CATS[0];

export const ONLINE = 'Onlayn';
export const REGIONS = {
  'Toshkent shahri': ['Bektemir', 'Chilonzor', 'Mirobod', "Mirzo Ulug'bek", 'Olmazor', 'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yashnobod', 'Yangihayot', 'Yunusobod'],
  'Toshkent viloyati': ['Nurafshon', 'Angren', 'Olmaliq', 'Bekobod', 'Chirchiq', 'Ohangaron', "Yangiyo'l", "Bo'ka", "Bo'stonliq", 'Chinoz', "Oqqo'rg'on", "O'rtachirchiq", 'Parkent', 'Piskent', 'Qibray', 'Quyichirchiq', 'Toshkent tumani', 'Yuqorichirchiq', 'Zangiota'],
  'Andijon viloyati': ['Andijon shahri', 'Xonobod', 'Andijon tumani', 'Asaka', 'Baliqchi', "Bo'ston", 'Buloqboshi', 'Izboskan', 'Jalaquduq', 'Marhamat', "Oltinko'l", 'Paxtaobod', "Qo'rg'ontepa", 'Shahrixon', "Ulug'nor", "Xo'jaobod"],
  "Farg'ona viloyati": ["Farg'ona shahri", "Marg'ilon", "Qo'qon", 'Quvasoy', 'Beshariq', "Bog'dod", 'Buvayda', "Dang'ara", "Farg'ona tumani", 'Furqat', 'Oltiariq', "O'zbekiston tumani", "Qo'shtepa", 'Quva', 'Rishton', "So'x", 'Toshloq', "Uchko'prik", 'Yozyovon'],
  'Namangan viloyati': ['Namangan shahri', 'Chortoq', 'Chust', 'Davlatobod', 'Kosonsoy', 'Mingbuloq', 'Namangan tumani', 'Norin', 'Pop', "To'raqo'rg'on", "Uchqo'rg'on", 'Uychi', 'Yangi Namangan', "Yangiqo'rg'on"],
  'Samarqand viloyati': ['Samarqand shahri', "Kattaqo'rg'on", "Bulung'ur", 'Ishtixon', 'Jomboy', 'Narpay', 'Nurobod', 'Oqdaryo', "Past Darg'om", 'Paxtachi', 'Payariq', "Qo'shrabot", 'Samarqand tumani', 'Toyloq', 'Urgut'],
  'Buxoro viloyati': ['Buxoro shahri', 'Kogon', 'Buxoro tumani', "G'ijduvon", 'Jondor', 'Kogon tumani', 'Olot', 'Peshku', "Qorako'l", 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent'],
  'Navoiy viloyati': ['Navoiy shahri', 'Zarafshon', "G'ozg'on", 'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi'],
  'Qashqadaryo viloyati': ['Qarshi', 'Shahrisabz', 'Chiroqchi', "Dehqonobod", "G'uzor", 'Kasbi', 'Kitob', 'Koson', "Ko'kdala", 'Mirishkor', 'Muborak', 'Nishon', 'Qamashi', 'Qarshi tumani', 'Shahrisabz tumani', "Yakkabog'"],
  'Surxondaryo viloyati': ['Termiz', 'Angor', 'Bandixon', 'Boysun', 'Denov', "Jarqo'rg'on", 'Muzrabot', 'Oltinsoy', 'Qiziriq', "Qumqo'rg'on", 'Sariosiyo', 'Sherobod', "Sho'rchi", 'Termiz tumani', 'Uzun'],
  'Jizzax viloyati': ['Jizzax shahri', 'Arnasoy', 'Baxmal', "Do'stlik", 'Forish', "G'allaorol", "Mirzacho'l", 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zafarobod', 'Zarbdor', 'Zomin'],
  'Sirdaryo viloyati': ['Guliston', 'Shirin', 'Yangiyer', 'Boyovut', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Sirdaryo tumani', 'Xovos'],
  'Xorazm viloyati': ['Urganch', 'Xiva', "Bog'ot", 'Gurlan', 'Hazorasp', "Qo'shko'pir", 'Shovot', "Tuproqqal'a", 'Urganch tumani', 'Xiva tumani', 'Xonqa', 'Yangiariq', 'Yangibozor'],
  "Qoraqalpog'iston Respublikasi": ['Nukus', 'Amudaryo', 'Beruniy', "Bo'zatov", 'Chimboy', "Ellikqal'a", 'Kegeyli', "Mo'ynoq", 'Nukus tumani', "Qanliko'l", "Qorao'zak", "Qo'ng'irot", 'Shumanay', 'Taxiatosh', "Taxtako'pir", "To'rtko'l", "Xo'jayli"],
};
export const REG_NAMES = Object.keys(REGIONS);

export const UNITS = { '': 'Jami', oy: '/ oy', video: '/ video', post: '/ post', loyiha: '/ loyiha', kun: '/ kun', soat: '/ soat' };

export const SVC = {
  vip: "VIP e'lon",
  top: "TOP e'lon",
  bump: "Ko'tarish",
  extend: 'Muddatni uzaytirish',
  restore: "E'lonni tiklash",
  slots: "Qo'shimcha e'lon joylari",
};
export function svcDesc(k, cfg) {
  const d = cfg?.promo_days ?? 7, a = cfg?.ad_days ?? 30, p = cfg?.slot_pack ?? 5;
  return {
    vip: `${d} kun bosh sahifadagi VIP blokda, oltin ramka bilan. TOP imtiyozlari ham kiradi.`,
    top: `${d} kun qidiruv va kategoriya natijalarining eng tepasida.`,
    bump: "E'lon yangi e'lonlar ro'yxatining eng tepasiga qaytadi.",
    extend: `E'lon yana ${a} kun faol bo'ladi.`,
    restore: `Arxivdagi e'lon qayta faollashadi va ${a} kun ko'rinadi.`,
    slots: `Bepul limitdan tashqari yana ${p} ta e'lon joylash imkoniyati.`,
  }[k];
}

export const DEF_CFG = {
  prices: { top: 25000, vip: 49000, bump: 9000, slots: 19000, extend: 5000, restore: 7000 },
  free_ads: 5, slot_pack: 5, promo_days: 7, ad_days: 30, pay_text: '',
};

// Ilova tomonida tez tekshiruv (server ham xuddi shuni tekshiradi)
const CONTACT_RX = /(t\.me\/|telegram\.me|telegram(dan|ga| orqali)|instagram\.com\/|wa\.me|whatsapp|vatsap|(^|[\s(])@[a-z][a-z0-9_]{3,})/i;
const BAN_RX = /(sotiladi|sotaman|ijaraga|arenda|kvartira|kredit|kazino|casino|bukmeker|intim|narkotik|продаю|продам|аренда|квартир|кредит|казино)/i;
export function checkText(t) {
  if (CONTACT_RX.test(t)) return "Tashqi kontakt (Telegram, Instagram, WhatsApp) yozib bo'lmaydi. Mijozlar ilova ichidagi chat orqali yozadi.";
  if (BAN_RX.test(t)) return 'Bu bozor faqat ijodiy va marketing xizmatlari uchun (SMM, montaj, dizayn, marketing...).';
  return null;
}
