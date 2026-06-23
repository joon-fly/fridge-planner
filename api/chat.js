export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, ingredients } = req.body;

  const MENUS = [
    {menu:"김치찌개",meat:["돼지 앞다리살","돼지 목살","돼지 삼겹살"],veg:["두부","양파","대파"]},
    {menu:"된장찌개",meat:[],veg:["두부","애호박","양파","감자","버섯"]},
    {menu:"제육볶음",meat:["돼지 앞다리살","돼지 목살"],veg:["양파","대파"]},
    {menu:"불고기",meat:["소 목심","소 불고기용 앞다리"],veg:["양파","대파","당근"]},
    {menu:"닭볶음탕",meat:["닭볶음탕용 닭"],veg:["감자","당근","양파","대파"]},
    {menu:"카레라이스",meat:["돼지 앞다리살","돼지 뒷다리살"],veg:["감자","당근","양파"]},
    {menu:"오징어볶음",meat:["오징어"],veg:["양파","대파","당근"]},
    {menu:"계란말이",meat:["계란"],veg:["대파","당근"]},
    {menu:"계란찜",meat:["계란"],veg:["대파"]},
    {menu:"콩나물국",meat:[],veg:["콩나물","대파"]},
    {menu:"미역국",meat:["소 양지","소 국거리"],veg:["미역"]},
    {menu:"소고기무국",meat:["소 양지","소 국거리"],veg:["무","대파"]},
    {menu:"순두부찌개",meat:["돼지 앞다리살","계란"],veg:["순두부","양파","대파"]},
    {menu:"부대찌개",meat:["햄","소시지"],veg:["두부","양파","대파"]},
    {menu:"감자조림",meat:[],veg:["감자"]},
    {menu:"멸치볶음",meat:["멸치"],veg:[]},
    {menu:"장조림",meat:["소 사태","소 우둔살","메추리알"],veg:[]},
    {menu:"고등어구이",meat:["고등어"],veg:[]},
    {menu:"닭갈비",meat:["닭다리살"],veg:["양배추","고구마","양파","대파"]},
    {menu:"비빔밥",meat:["계란"],veg:["시금치","콩나물","당근"]},
  ];

  const system = `당신은 가정용 냉장고 재고 관리 및 메뉴 추천 AI입니다. 아래 20가지 메뉴 레퍼토리와 현재 재고를 기반으로 추천합니다.

메뉴 레퍼토리: ${MENUS.map(m=>m.menu).join(', ')}

현재 재고:
${ingredients}

응답 규칙:
1. 바로 만들 수 있는 메뉴를 우선 추천하세요.
2. 유통기한 짧은 재료를 먼저 쓰는 방향을 우선시하세요.
3. 메뉴별로 어떤 재료를 얼마나 쓰는지 언급하세요.
4. 사용 후 남은 재료량도 알려주세요.
5. 주간 계획 시 요일별로 작성하고 재료 낭비를 최소화하세요.
6. 장보기 추천 시 구체적 수량을 포함하세요.
7. 사용자가 재료를 사용했다고 하면 [UPDATE:{"name":"재료명","usedQty":숫자}] 형식으로 포함하세요.
8. 답변은 한국어로, 이모지를 적절히 사용해 친근하게 작성하세요.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(500).json({ error: `API error: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data).slice(0, 200));

    const reply = data.content?.[0]?.text;
    if (!reply) {
      console.error('No reply in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response', detail: JSON.stringify(data) });
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
