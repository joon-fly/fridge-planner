// 문래점 기준 롯데마트 실시간 재고 확인용 단축 엔드포인트.
// 사용법: /api/stock?keyword=계란
const BASE = 'https://lottemart-mcp.joon9296.workers.dev';
const DEFAULT_STORE = '문래점';
const DEFAULT_AREA = '서울';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

  const { keyword, storeName, area } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'keyword 파라미터가 필요해요. 예: /api/stock?keyword=계란' });
  }

  const store = storeName || DEFAULT_STORE;
  const searchArea = area || DEFAULT_AREA;

  const data = await fetchWithRetry(
    `${BASE}/api/lottemart/products?storeName=${encodeURIComponent(store)}&keyword=${encodeURIComponent(keyword)}&area=${encodeURIComponent(searchArea)}`
  );

  if (!data?.success) {
    return res.status(200).json({
      keyword,
      storeName: store,
      success: false,
      error: data?.error?.message || '조회에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  }

  const products = (data.data?.products || []).map(p => ({
    name: p.productName,
    spec: p.spec,
    price: p.price,
    inStock: (p.stockQuantity || 0) > 0,
  }));

  res.status(200).json({ keyword, storeName: store, success: true, count: products.length, products });
}
