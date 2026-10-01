import { supabase } from './supabase';
import { ONLINE } from './data';

const q = (s) => '"' + String(s).replace(/"/g, '') + '"';
const clean = (s) => String(s || '').replace(/[,()"%*\\]/g, ' ').trim();

export const PAGE = 24;

// Lenta: filtrlar bilan e'lonlar
export async function fetchFeed({ search, cat, region, district, kind, sort = 'new', min, max, photo, userId, exclude, from = 0, limit = PAGE }) {
  let r = supabase.from('ad_feed').select('*');
  if (cat) r = r.eq('cat', cat);
  if (kind) r = r.eq('kind', kind);
  if (userId) r = r.eq('user_id', userId);
  if (exclude) r = r.neq('id', exclude);
  if (photo) r = r.neq('photos', '{}');
  if (region && region !== ONLINE) {
    r = r.or(`region.eq.${q(region)},region.eq.${ONLINE}`);
    if (district) r = r.or(`district.eq.${q(district)},region.eq.${ONLINE}`);
  } else if (region === ONLINE) r = r.eq('region', ONLINE);
  if (min) r = r.gte('price_uzs', min);
  if (max) r = r.lte('price_uzs', max);
  const s = clean(search);
  if (s) r = r.or(`title.ilike.%${s}%,description.ilike.%${s}%,seller_name.ilike.%${s}%,district.ilike.%${s}%,region.ilike.%${s}%`);
  r = r.order('rank', { ascending: false });
  if (sort === 'cheap') r = r.order('price_uzs', { ascending: true, nullsFirst: false });
  else if (sort === 'exp') r = r.order('price_uzs', { ascending: false, nullsFirst: false });
  r = r.order('sort_at', { ascending: false }).range(from, from + limit - 1);
  const { data, error } = await r;
  if (error) throw error;
  return data || [];
}

export async function fetchVip(region) {
  let r = supabase.from('ad_feed').select('*').gt('vip_until', new Date().toISOString());
  if (region && region !== ONLINE) r = r.or(`region.eq.${q(region)},region.eq.${ONLINE}`);
  const { data } = await r.order('sort_at', { ascending: false }).limit(12);
  return data || [];
}

export async function fetchProfiles(ids) {
  const u = [...new Set(ids.filter(Boolean))];
  if (!u.length) return {};
  const { data } = await supabase.from('profiles').select('*').in('id', u);
  const m = {};
  (data || []).forEach((p) => { m[p.id] = p; });
  return m;
}
