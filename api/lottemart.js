const BASE = 'https://mcp.aka.page';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// mcp.aka.page(롯데마트 상품 검색 프록시)가 세션/토큰 문제로 종종 실패한다.
// 응답 자체가 retryable:true를 알려주기 때문에, 실패 시 한 번 더 시도한다.
async function fetchWithRetry(url, retries = 1) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url);
      const data = await r.json();
      if (data?.success !== false) return data;
      last = data;
    } catch (e) {
      last = { success: false, error: { message: e.message } };
    }
    if (i < retries) await sleep(500);
  }
  return last;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { action, keyword, area, storeName } = req.query;

  try {
    if (action === 'stores') {
      // 매장 검색
      const data = await fetchWithRetry(`${BASE}/api/lottemart/stores?keyword=${encodeURIComponent(keyword||'')}&area=${encodeURIComponent(area||'서울')}`);
      return res.status(200).json(data);
    }

    if (action === 'products') {
      // 상품 검색
      const data = await fetchWithRetry(`${BASE}/api/lottemart/products?storeName=${encodeURIComponent(storeName||'')}&keyword=${encodeURIComponent(keyword||'')}&area=${encodeURIComponent(area||'서울')}`);
      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'action 파라미터가 필요해요 (stores 또는 products)' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
