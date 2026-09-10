import { verifyUser, serviceHeaders, unauthorized } from '../lib/auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const user = await verifyUser(req);
  if (!user) return unauthorized(res);

  const headers = serviceHeaders();
  const uid = encodeURIComponent(user.id);

  // 기본 메뉴(user_id=null) + 내 메뉴 함께 불러오기
  if (req.method === 'GET') {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/menus?or=(user_id.eq.${uid},user_id.is.null)&order=created_at.asc`,
      { headers }
    );
    const data = await r.json();
    return res.status(200).json(data);
  }

  // 메뉴 추가 (항상 본인 소유로 저장)
  if (req.method === 'POST') {
    const { name, category, meat, veg } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/menus`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name, category, meat, veg, user_id: user.id })
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  // 메뉴 삭제: 본인 메뉴만. user_id 조건 덕분에 기본 메뉴(user_id=null)도 지워지지 않는다.
  if (req.method === 'DELETE') {
    const id = encodeURIComponent(req.query.id || '');
    await fetch(`${SUPABASE_URL}/rest/v1/menus?id=eq.${id}&user_id=eq.${uid}`, {
      method: 'DELETE',
      headers
    });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
