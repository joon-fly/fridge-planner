// mcp.aka.page(원본 daiso-mcp 공개 인스턴스)의 롯데마트 페이지네이션 토큰 만료 버그를
// 고친 자체 호스팅 포크. https://github.com/joon-fly/daiso-mcp
const BASE = 'https://lottemart-mcp.joon9296.workers.dev';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 자체 호스팅 쪽에서도 내부적으로 재시도하지만, 롯데마트 쪽 실패율이 꽤 있어서
// (건당 1/6 정도) 여기서도 몇 번 더 시도해야 체감 실패율이 확 줄어든다.
async function fetchWithRetry(url, retries = 2) {
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
