const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function getHeaders(token) {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const token = req.headers.authorization?.replace('Bearer ', '') || SUPABASE_KEY;
  const headers = getHeaders(token);

  // 기본 메뉴(user_id=null) + 내 메뉴 함께 불러오기
  if (req.method === 'GET') {
    const { user_id } = req.query;
    const filter = user_id
      ? `?or=(user_id.eq.${user_id},user_id.is.null)&order=created_at.asc`
      : `?user_id=is.null&order=created_at.asc`;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/menus${filter}`, { headers });
    const data = await r.json();
    return res.status(200).json(data);
  }

  // 메뉴 추가
  if (req.method === 'POST') {
    const { name, category, meat, veg, user_id } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/menus`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name, category, meat, veg, user_id })
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  // 메뉴 삭제 (본인 메뉴만)
  if (req.method === 'DELETE') {
    const { id, user_id } = req.query;
    await fetch(`${SUPABASE_URL}/rest/v1/menus?id=eq.${id}&user_id=eq.${user_id}`, {
      method: 'DELETE',
      headers
    });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
