const MENUS = [
  {menu:"김치찌개",  meat:["돼지 앞다리살","돼지 목살","돼지 삼겹살"], veg:["두부","양파","대파"]},
  {menu:"된장찌개",  meat:[],                                           veg:["두부","애호박","양파","감자","버섯"]},
  {menu:"제육볶음",  meat:["돼지 앞다리살","돼지 목살"],                veg:["양파","대파"]},
  {menu:"불고기",    meat:["소 목심","소 불고기용 앞다리"],             veg:["양파","대파","당근"]},
  {menu:"닭볶음탕",  meat:["닭볶음탕용 닭"],                            veg:["감자","당근","양파","대파"]},
  {menu:"카레라이스",meat:["돼지 앞다리살","돼지 뒷다리살"],            veg:["감자","당근","양파"]},
  {menu:"오징어볶음",meat:["오징어"],                                   veg:["양파","대파","당근"]},
  {menu:"계란말이",  meat:["계란"],                                     veg:["대파","당근"]},
  {menu:"계란찜",    meat:["계란"],                                     veg:["대파"]},
  {menu:"콩나물국",  meat:[],                                           veg:["콩나물","대파"]},
  {menu:"미역국",    meat:["소 양지","소 국거리"],                      veg:["미역"]},
  {menu:"소고기무국",meat:["소 양지","소 국거리"],                      veg:["무","대파"]},
  {menu:"순두부찌개",meat:["돼지 앞다리살","계란"],                     veg:["순두부","양파","대파"]},
  {menu:"부대찌개",  meat:["햄","소시지"],                              veg:["두부","양파","대파"]},
  {menu:"감자조림",  meat:[],                                           veg:["감자"]},
  {menu:"멸치볶음",  meat:["멸치"],                                     veg:[]},
  {menu:"장조림",    meat:["소 사태","소 우둔살","메추리알"],           veg:[]},
  {menu:"고등어구이",meat:["고등어"],                                   veg:[]},
  {menu:"닭갈비",    meat:["닭다리살"],                                 veg:["양배추","고구마","양파","대파"]},
  {menu:"비빔밥",    meat:["계란"],                                     veg:["시금치","콩나물","당근"]},
];

const MENU_NAMES = MENUS.map(m => m.menu).join(', ');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, ingredients } = req.body;

  const system = `당신은 가정용 냉장고 재고 관리 및 메뉴 추천 AI입니다.

## 우리집 고정 메뉴 레퍼토리 (20가지)
${MENU_NAMES}

## 추천 원칙
- 기본적으로 위 20가지 레퍼토리 안에서만 추천합니다.
- 새로운 메뉴는 사용자가 명시적으로 요청할 때만, 주 1~2회 정도 제안합니다.
- 조미료(고추장, 간장, 된장, 참기름, 김치, 소금, 다진마늘, 고춧가루, 물엿, 카레가루, 새우젓, 국간장 등)는 항상 구비되어 있다고 가정합니다. 재고 파악 및 장보기 추천에서 제외하세요.

## 현재 재고 (육류/야채만)
${ingredients}

## 응답 규칙
1. 재고로 바로 만들 수 있는 레퍼토리 메뉴를 우선 추천하세요.
2. 유통기한이 짧은 재료를 먼저 소진하는 방향으로 추천하세요.
3. 메뉴별로 재료 사용량과 남은 재료량을 언급하세요.
4. 주간 계획 시 요일별로 구성하고 재료 낭비를 최소화하세요.
5. 장보기 추천은 육류/야채만, 구체적 수량으로 알려주세요.
6. 재료 사용 후 업데이트 요청 시 [UPDATE:{"name":"재료명","usedQty":숫자}] 형식을 포함하세요.
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
    if (!reply) {
      console.error('No reply:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response' });
    }
    res.status(200).json({ reply });
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
