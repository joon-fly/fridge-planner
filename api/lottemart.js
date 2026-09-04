const BASE = 'https://mcp.aka.page';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { action, keyword, area, storeName } = req.query;

  try {
    if (action === 'stores') {
      // 매장 검색
      const r = await fetch(`${BASE}/api/lottemart/stores?keyword=${encodeURIComponent(keyword||'')}&area=${encodeURIComponent(area||'서울')}`);
      const data = await r.json();
      return res.status(200).json(data);
    }

    if (action === 'products') {
      // 상품 검색
      const r = await fetch(`${BASE}/api/lottemart/products?storeName=${encodeURIComponent(storeName||'')}&keyword=${encodeURIComponent(keyword||'')}&area=${encodeURIComponent(area||'서울')}`);
      const data = await r.json();
      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'action 파라미터가 필요해요 (stores 또는 products)' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
