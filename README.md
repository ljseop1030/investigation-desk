# Investigation Desk

경찰서 강력팀에 3개월 계약으로 들어온 수사보조가 되어, 사내 시스템에 흩어진 자료를 모아 양식을 채워 제출하는 웹 게임.

담당자들은 각자의 속도로 답한다. 바로 답하는 사람, 12분 뒤에 답하는 사람, 소관이 아니라며 끊는 사람. 기다리는 시간도 업무의 일부다.
> 확인되지 않은 항목은 공란으로 두지 말고 담당자에게 확인한다.

등장하는 인물·사건·기관은 모두 허구입니다.

**플레이** https://investigation-desk.pages.dev/ (개발 배포. 데스크톱 브라우저 권장)

**현재 단계** P6 프롬프트 튜닝 중. 담당자 대화는 LLM(Gemini)이 맡고, 모델이 실패하면 캐릭터 fallback 대사로 이어진다.

---

## 프로젝트 구조

```
content/          사건, 문서, 양식, 캐릭터, persona (프라이빗 서브모듈)
client/           브라우저 진입점과 화면
  main.jsx          조립 지점. 여기만 전 층을 안다
  content-loader.js  save.js  activity.js
  ui/               DOM
core/             게임 로직. DOM과 fetch를 모른다
  scheduler.js      절대시각 큐
  state.js  actions.js  events.js  view.js
  rules/            chat · records · forms · story · notices · timing
adapters/         플랫폼 경계. 시계, 저장소, AI
  ai/               core ↔ /api/chat 번역기
functions/api/    서버. Cloudflare Pages Functions
  chat.js           POST /api/chat — 프롬프트 조립 · 모델 호출 · 응답 검증
shared/           enums. 코드가 쓰는 어휘
scripts/          check-content — 배포 전 서브모듈 점검
docs/notes.md     단계별 판단과 근거
```

실제 시나리오 데이터(`content/`)는 별도의 프라이빗 저장소다. 뭐가 어디 있는지 모르는 게 이 게임의 절반이라서.
콘텐츠 없이도 코드는 빌드되고 테스트는 통과한다. 그 성질이 CI와 라이선스 분리에 걸려 있다.

---

## AI 대화가 도는 방식

```
플레이어 메시지
  → core가 읽음·답장 시각을 스케줄러에 예약
  → 답장 시각이 되면 adapters/ai가 /api/chat 호출
      보내는 것: characterId, 대화 이력, playerName (그 외는 보내지 않는다)
  → 서버가 characterId로 persona를 꺼내 시스템 프롬프트 조립
  → Gemini 호출 (responseSchema로 JSON 강제)
      { messages, delivers, ghost, leak }
  → 서버 validate: 모양만 맞춘다. 말풍선 상한, 줄머리 장식 제거
  → core validDeliveries: 자료 건넴을 판정한다
  → 말풍선 시각을 다시 잡아 하나씩 도착
```

- **모델이 준 키를 그대로 믿지 않는다.** 모델이 "자료를 넘겼다"고 해도, 그 자료가 실재하고, 그 사람 소관이고, 아직 안 준 것일 때만 상태가 바뀐다. 판정은 core 한 군데에만 있다. 서버와 어댑터는 모양만 본다. 규칙이 두 군데가 되면 한쪽만 고치게 된다.
- **클라이언트가 말해주는 것은 신뢰하지 않는다.** persona도 말풍선 범위도 서버가 `characterId`로 꺼낸다. 예외는 플레이어가 직접 입력한 `playerName` 하나이고, P10에서 사라진다.
- **실패는 캐릭터의 말로 덮는다.** 서버는 그럴듯한 대사를 지어내지 않고 상태 코드만 돌려준다. 어댑터가 던지면 core가 캐릭터 fallback 대사로 답한다. 침묵(`ghost`)과 실패는 다른 일로 다룬다.
- **호출마다 남긴다.** 캐릭터, 모델명, 상태 코드, 지연(ms)을 성공·실패 구분 없이 한 줄로 로그에 찍는다. 거부 사유는 응답이 아니라 서버 로그에만.
- **AI 호출 중 창이 닫혀도 대화가 끊기지 않는다.** `working`이 켜진 채 저장되면 불러올 때 되돌리고, 호출 직전에 비운 대기 메시지를 복원해 답장을 다시 잡는다.

---

## 테스트와 배포

- `node --test` 168개. core는 브라우저도 콘텐츠도 없이 돈다
- 시간은 `clock.now()`로 주입. 12분짜리 답장도 테스트에서는 건너뛴다
- **CI** PR·main push마다 테스트. 콘텐츠가 없는 환경에서 도는 것이 정상이다
- **Deploy** main push 시 서브모듈까지 받아 테스트 → `check:content` → 빌드 → Cloudflare Pages
  - `check:content` 서브모듈이 조용히 빠지면 빌드는 성공하고 `/api/chat`만 502를 뱉는다. 그걸 빌드 앞에서 빨간불로 만든다
  - 빌드 산출물에 API 키로 보이는 문자열이 있으면 배포를 멈춘다

---

## TODO

**기반**

- [x] Prototype 시뮬레이션 (vibe code)
- [x] P0 깃허브 저장소
- [x] P1 콘텐츠 분리
- [x] P2 core + 테스트 + CI
- [x] P3 UI
- [x] P3.5 비주얼 방향

**개발 배포** — URL 하나. 혼자 쓴다.

- [x] P4 문구 정리 · 서브모듈 · 세이브 · 배포
- [x] P5 AI proxy + 재배포

**다듬기** — 배포 상태 유지, 계속 반영

- [ ] P6 프롬프트 튜닝 · 모델 비교
  - [x] P6-0 배포 마감 · `strip` 버그 · 성공 경로 모델 로그
  - [x] P6-3 자료를 레코드로 통합 (머지 후 관측 남음)
  - [ ] P6-4 본 튜닝 — 모델 비교 축은 `RPM / 503률 / 지연`
- [ ] P7 스토리 재작성
- [ ] P8 하이브리드 대화 (스크립트 + LLM)
- [ ] P9 언어 다양화 (번역)

**공개 준비**

- [ ] P10 계정 · 서버 세이브 · 정답과 미해금 본문 서버 이관
- [ ] P11 레이트 리밋 · 비용 가드
- [ ] P12 itch.io 공개 (목표)

단계별 판단과 근거는 [`docs/notes.md`](docs/notes.md)에.

---

## 실행 방법

Node 22 이상.

```bash
npm ci
npm test              # 콘텐츠 없이도 통과한다
```

화면과 AI 대화까지 돌리려면 `content/` 서브모듈 접근 권한이 필요하다.

```bash
git submodule update --init
cp .env.example .env  # GEMINI_API_KEY를 채운다. VITE_ 접두사를 붙이지 말 것

npm run build
npm run dev:api       # 함수 (8788)
npm run dev           # 화면 (5173). /api는 8788로 프록시된다
```

`dev:api`를 켜지 않으면 모든 대화가 캐릭터 fallback 대사로 돈다. 폴백 경로가 매일 자동으로 검증되는 셈이라 일부러 그렇게 둔다.

---

## 메모

- **스케줄러.** `setTimeout` 대신 절대시각을 큐에 쌓고 1초 tick이 만기된 것만 실행한다. 창을 닫았다 열어도 예약된 답장이 이어져야 해서.
- **core는 독립적으로.** 채점도 타이밍 계산도 브라우저 없이 돌아가야 한다.
- **시간 주입.** `clock.now()`. 테스트에서 몇 시간을 건너뛰려고.
- **세이브는 한 덩어리.** 진행·예약·화면을 함께 쓴다. 따로 저장하면 어긋난 순간에 창이 닫혔을 때 유령 예약이 남는다.
- **persona는 서버에.** 클라이언트에 내려가면 F12로 게임이 끝난다. 자료 건넴도 core가 검증한다.
- **알려진 한계.** 정답과 미해금 자료 본문은 아직 번들에 있다. 화면은 가리지만 F12로는 보인다. 해금 판정을 서버가 할 수 있는 P10에서 옮긴다.
- **콘텐츠는 파일, 진행만 DB.** 사건을 DB에 넣으면 문장 하나 고칠 때마다 마이그레이션이다.

---

## 라이선스

미정. 별도 명시 전까지 모든 권리를 보유한다.
