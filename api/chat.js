export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, ingredients, storeInfo } = req.body;

  const storeContext = storeInfo?.store_name
    ? `\n\n## 선호 마트 정보\n매장: ${storeInfo.store_name} (${storeInfo.store_area || ''})\n장보기 추천 시 이 매장 기준으로 안내하세요.`
    : '';

  const lotteMartContext = storeInfo?.products?.length
    ? `\n\n## 롯데마트 실시간 상품 정보 (${storeInfo.store_name})\n${storeInfo.products.map(p =>
        `- ${p.productName} | ${p.spec} | ${p.price.toLocaleString()}원 | 재고: ${p.stockQuantity > 0 ? '있음' : '없음'}`
      ).join('\n')}\n\n위 실시간 데이터를 활용해서 구체적인 장보기 가이드를 제공하세요. 용량(spec)과 가격을 참고해서 "600g짜리 1팩 사면 오늘 제육볶음 400g, 남은 200g은 내일 찌개에 쓸 수 있어요" 형태로 안내하세요.`
    : '';

  const system = `당신은 가정용 냉장고 재고 관리 및 메뉴 추천 AI입니다. 현재 재고와 메뉴 레퍼토리를 기반으로 추천합니다.

## 추천 원칙
- 전체 메뉴 레퍼토리 안에서 우선 추천합니다.
- 새로운 메뉴는 사용자가 명시적으로 요청할 때만, 주 1~2회 정도 제안합니다.
- 조미료(고추장, 간장, 된장, 참기름, 김치, 소금, 다진마늘 등)는 항상 구비되어 있다고 가정합니다.${storeContext}${lotteMartContext}

## 영양 균형 원칙
1. 단백질 공급원 다양화: 돼지/소/닭/해산물/계란을 골고루, 같은 육류 3일 이상 연속 금지
2. 조리법 다양화: 찌개류 주 3회 이하, 볶음/구이/국/찜 번갈아
3. 채소 섭취 균형: 채소 부족한 날은 반찬 추가 안내
4. 영양 포인트: 메뉴마다 한 줄 영양 코멘트

## 현재 재고 및 메뉴 레퍼토리
${ingredients}

## 응답 규칙
1. 재고로 바로 만들 수 있는 메뉴를 우선 추천하세요.
2. 유통기한 짧은 재료를 먼저 소진하는 방향으로 추천하세요.
3. 메뉴별로 재료 사용량과 남은 재료량을 언급하세요.
4. 주간 계획 시 요일별로 구성하고 재료 낭비를 최소화하세요.
5. 장보기 추천 시 롯데마트 실시간 상품 정보가 있으면 활용하고, 없으면 일반적인 마트 기준으로 안내하세요.
6. 재료 사용 후 업데이트 요청 시 [UPDATE:{"name":"재료명","usedQty":숫자}] 형식으로 포함하세요.
7. 답변은 한국어로, 이모지를 적절히 사용해 친근하게 작성하세요.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system, messages })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(500).json({ error: `API error: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'Empty response' });
    res.status(200).json({ reply });
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
