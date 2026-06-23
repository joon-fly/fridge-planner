const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ingredients?order=created_at.asc`, { headers });
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, cat, storage_type, qty, unit } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ingredients`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ name, cat, storage_type, qty, unit })
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await fetch(`${SUPABASE_URL}/rest/v1/ingredients?id=eq.${id}`, { method: 'DELETE', headers });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ingredients?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
