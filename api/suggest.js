import { verifyUser, unauthorized } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 인증 없이 열어두면 누구나 호출해서 Anthropic 크레딧을 소진시킬 수 있다.
  const user = await verifyUser(req);
  if (!user) return unauthorized(res);

  const { menuName } = req.body;

  const system = `당신은 요리 전문가입니다. 사용자가 메뉴 이름을 입력하면 해당 메뉴의 카테고리와 필요한 주재료를 JSON 형식으로 반환해주세요.

응답은 반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "category": "한식 또는 양식 또는 일식 또는 중식 또는 기타",
  "meat": ["육류/어류 재료1", "육류/어류 재료2"],
  "veg": ["야채/기타 재료1", "야채/기타 재료2"],
  "description": "메뉴에 대한 한 줄 설명"
}

규칙:
- meat에는 육류, 어류, 계란, 가공육만 포함
- veg에는 야채, 두부, 해조류, 버섯 등 포함
- 조미료(간장, 고추장, 소금 등)는 제외
- 재료는 한국어로, 가장 일반적인 이름 사용`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        system,
        messages: [{ role: 'user', content: `메뉴 이름: ${menuName}` }]
      })
    });

    const data = await response.json();
    // adaptive thinking이 켜져 있으면 content[0]이 thinking 블록일 수 있어서, text 블록을 명시적으로 찾는다.
    const text = data.content?.find(b => b.type === 'text')?.text || '{}';

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.status(200).json(parsed);
    } catch(e) {
      return res.status(500).json({ error: 'JSON 파싱 실패', raw: text });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
