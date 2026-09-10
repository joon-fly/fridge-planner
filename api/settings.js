import { verifyUser, serviceHeaders, unauthorized } from '../lib/auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const user = await verifyUser(req);
  if (!user) return unauthorized(res);

  const headers = serviceHeaders();
  const uid = encodeURIComponent(user.id);

  if (req.method === 'GET') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${uid}`, { headers });
    const data = await r.json();
    return res.status(200).json(data[0] || null);
  }

  if (req.method === 'POST') {
    const { store_name, store_area } = req.body;
    // upsert (있으면 업데이트, 없으면 삽입) — user_id는 검증된 값으로 고정
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        user_id: user.id,
        store_name,
        store_area,
        updated_at: new Date().toISOString()
      })
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
