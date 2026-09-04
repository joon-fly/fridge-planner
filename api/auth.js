const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password } = req.body;

  if (action === 'login') {
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await r.json();
      console.log('Supabase auth response:', JSON.stringify(data).slice(0, 300));

      if (!r.ok || data.error) {
        return res.status(401).json({ error: data.error_description || data.msg || '이메일 또는 비밀번호가 올바르지 않아요.' });
      }

      // Supabase 응답 구조: data.access_token, data.user
      const user = data.user;
      if (!user) {
        return res.status(401).json({ error: '사용자 정보를 가져올 수 없어요.' });
      }

      return res.status(200).json({
        access_token: data.access_token,
        user: { id: user.id, email: user.email }
      });
    } catch (err) {
      console.error('Auth error:', err.message);
      return res.status(500).json({ error: '서버 오류가 발생했어요.' });
    }
  }

  res.status(400).json({ error: 'Unknown action' });
}
