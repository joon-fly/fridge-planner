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

  if (req.method === 'GET') {
    const { user_id } = req.query;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${user_id}`, { headers });
    const data = await r.json();
    return res.status(200).json(data[0] || null);
  }

  if (req.method === 'POST') {
    const { user_id, store_name, store_area } = req.body;
    // upsert (있으면 업데이트, 없으면 삽입)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ user_id, store_name, store_area, updated_at: new Date().toISOString() })
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
