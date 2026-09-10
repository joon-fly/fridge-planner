const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

/**
 * 요청의 Bearer 토큰을 Supabase에 검증시키고 사용자 정보를 돌려준다.
 *
 * 토큰을 우리가 직접 디코드하면 서명 위조를 걸러낼 수 없으므로,
 * 반드시 Supabase(/auth/v1/user)에 물어봐서 확인한다.
 * 실패하면 null을 반환하며, 호출부는 이 경우 401로 응답해야 한다.
 */
export async function verifyUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return null;

    const user = await r.json();
    // anon 키를 토큰인 척 보내도 sub(id)가 없으므로 여기서 걸러진다.
    return user && user.id ? { id: user.id, email: user.email } : null;
  } catch {
    return null;
  }
}

/** Supabase 데이터 API 호출용 헤더 (권한 판단은 이미 우리 쪽에서 끝낸 상태) */
export function serviceHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
}

/** 인증 실패 응답 */
export function unauthorized(res) {
  return res.status(401).json({ error: '로그인이 필요해요.' });
}
