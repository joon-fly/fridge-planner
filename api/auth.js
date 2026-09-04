const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password } = req.body;

  if (action === 'login') {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (data.error) return res.status(401).json({ error: data.error_description || '로그인 실패' });
    return res.status(200).json({
      access_token: data.access_token,
      user: { id: data.user.id, email: data.user.email }
    });
  }

  res.status(400).json({ error: 'Unknown action' });
}
