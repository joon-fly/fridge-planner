# 🍳 우리집 메뉴 플래너 (fridge-planner)

냉장고 재고를 관리하고, AI와 채팅하면서 오늘 뭐 먹을지·이번 주 식단을 추천받고, 롯데마트 실시간 가격·재고까지 확인해서 장보기 목록을 짜주는 개인용 웹앱입니다.

## 주요 기능

- **재고 관리**: 육류/야채/기타 카테고리, 냉장·냉동 보관 방법별로 재료를 등록하고, 유통기한 임박 재료를 자동으로 알려줍니다.
- **메뉴 레퍼토리 관리**: 기본 제공 메뉴 + 직접 등록한 메뉴를 관리합니다. 메뉴 이름만 입력하면 AI가 카테고리·필요 재료를 자동으로 채워줍니다.
- **AI 메뉴 추천 채팅**: 현재 재고, 유통기한, 영양 균형(단백질원 다양화, 조리법 분산)을 고려해 오늘 메뉴·주간 식단을 추천합니다. Claude(Anthropic API) 기반입니다.
- **롯데마트 실시간 재고·가격 확인**: 선호 매장을 설정하면, 장보기 추천 시 그 매장의 실제 상품명·가격·재고를 조회해서 구체적으로 안내합니다.
- **첫 로그인 온보딩 투어**: 처음 로그인하면 재료 추가 → 메뉴 관리 → 매장 설정 → 메뉴 추천까지 실제 화면을 짚어가며 안내합니다. 헤더의 ❓ 버튼으로 언제든 다시 볼 수 있습니다.

## 기술 스택

- **프론트엔드**: 프레임워크 없는 순수 HTML/CSS/JS 단일 파일 (`index.html`)
- **백엔드**: Vercel Serverless Functions (`api/*.js`)
- **데이터베이스 & 인증**: [Supabase](https://supabase.com) (Postgres + Auth)
- **AI**: [Anthropic Claude API](https://www.anthropic.com) (`claude-sonnet-5`)
- **롯데마트 데이터**: 자체 호스팅 프록시 — [joon-fly/daiso-mcp](https://github.com/joon-fly/daiso-mcp) (Cloudflare Workers, [hmmhmmhm/daiso-mcp](https://github.com/hmmhmmhm/daiso-mcp)의 포크)

## API 엔드포인트

| 엔드포인트 | 역할 |
| --- | --- |
| `POST /api/auth` | Supabase 이메일/비밀번호 로그인 |
| `GET/POST/PATCH/DELETE /api/ingredients` | 재고 CRUD |
| `GET/POST/DELETE /api/menus` | 메뉴 레퍼토리 CRUD (기본 메뉴 + 내 메뉴) |
| `GET/POST /api/settings` | 선호 매장 등 사용자 설정 |
| `POST /api/chat` | 재고·메뉴·실시간 상품 정보 기반 AI 메뉴 추천 채팅 |
| `POST /api/suggest` | 메뉴 이름 입력 시 AI가 카테고리·재료 자동 추천 |
| `GET /api/lottemart` | 롯데마트 매장/상품 검색 프록시 (`action=stores`\|`products`) |
| `GET /api/stock` | 문래점 기준 롯데마트 실시간 재고 단축 조회 (`?keyword=`) |

## 환경 변수

Vercel 프로젝트에 아래 값을 등록해야 합니다 (Settings → Environment Variables):

| 변수 | 설명 |
| --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_KEY` | Supabase API 키 |
| `ANTHROPIC_API_KEY` | Anthropic API 키 |

## 로컬 개발

이 프로젝트는 프레임워크나 번들러 없이 정적 파일 + Vercel 서버리스 함수로 구성돼 있어서, 정적 파일만 볼 때는 브라우저로 `index.html`을 열어도 되지만 API 호출을 포함해 제대로 테스트하려면 Vercel CLI를 씁니다.

```bash
npm i -g vercel
vercel dev
```

## 배포

`main` 브랜치에 푸시하면 Vercel이 자동으로 배포합니다.

## 알려진 제한 사항

- 롯데마트 실시간 조회는 제3자 백엔드(롯데마트 자체 서버)에 의존하기 때문에 간헐적으로 실패할 수 있습니다. 실패 시 "재고 없음"이 아니라 "조회 실패"로 안내하고 일반 시세를 대신 보여줍니다.
- 매장 검색(`action=stores`)은 재시도해도 실패율이 상대적으로 높은 편입니다. 자주 쓰는 매장은 한 번 설정해두고 바꾸지 않는 걸 권장합니다.
