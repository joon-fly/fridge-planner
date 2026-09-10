import { verifyUser, serviceHeaders, unauthorized } from '../lib/auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // user_id는 절대 호출자가 보낸 값을 믿지 않고, 검증된 토큰에서만 얻는다.
  const user = await verifyUser(req);
  if (!user) return unauthorized(res);

  const headers = serviceHeaders();
  const uid = encodeURIComponent(user.id);

  if (req.method === 'GET') {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/ingredients?user_id=eq.${uid}&order=created_at.asc`,
      { headers }
    );
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, cat, storage_type, qty, unit } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ingredients`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name, cat, storage_type, qty, unit, user_id: user.id })
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  // 아래 두 개는 id뿐 아니라 user_id까지 함께 걸어서, 남의 행은 건드릴 수 없게 한다.
  if (req.method === 'DELETE') {
    const id = encodeURIComponent(req.query.id || '');
    await fetch(`${SUPABASE_URL}/rest/v1/ingredients?id=eq.${id}&user_id=eq.${uid}`, {
      method: 'DELETE',
      headers
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    const id = encodeURIComponent(req.query.id || '');
    // 요청 본문으로 user_id를 덮어쓰려는 시도는 무시한다.
    const { user_id: _ignored, id: _ignoredId, ...patch } = req.body || {};
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ingredients?id=eq.${id}&user_id=eq.${uid}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch)
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
