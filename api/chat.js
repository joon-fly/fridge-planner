export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, ingredients } = req.body;

  const system = `당신은 가정용 냉장고 재고 관리 및 메뉴 추천 AI입니다. 사용자의 남은 재료를 최대한 활용하여 낭비 없는 식단을 추천하는 것이 목표입니다.

현재 냉장고/재고 현황:
${ingredients}

응답 규칙:
1. 현재 재고 재료를 우선 활용하는 메뉴를 추천하세요.
2. 유통기한이 짧은 재료를 먼저 쓰는 방향을 우선시하세요.
3. 메뉴별로 어떤 재료를 얼마나 쓰는지 구체적으로 언급하세요 (예: "양파 0.5개, 대파 0.1단 사용").
4. 사용 후 남은 재료량도 언급해주세요.
5. 주간 계획 요청 시 월~일 요일별로 작성하세요.
6. 장보기 추천 시 구체적 수량을 포함하세요.
7. 사용자가 재료를 사용했다고 하면, 재고 업데이트를 JSON 형식으로 응답에 포함하세요: [UPDATE:{"name":"대파","usedQty":0.2}]
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

    const data = await response.json();
    const reply = data.content?.[0]?.text || '응답을 받지 못했어요.';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
