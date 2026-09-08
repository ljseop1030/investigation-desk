# 작업 노트

각 단계에서 무엇을 하고, 언제 끝난 것으로 보는지.

---

## P1 · 콘텐츠 분리

프로토타입의 상수 덩어리를 파일로 나누고, 공개/비공개 경계를 긋는다.

**브랜치** `chore/scaffold` → `refactor/content`

1. `npm init`, Vite 설치, 폴더 골격 생성 (빈 파일이라도 만들어 둔다)
2. `package.json` scripts 이름 확정 — `dev` `build` `test` `lint` `check`
   - CI는 결국 `npm run check` 한 줄이라, 이름을 먼저 정해두면 P2가 쉽다
3. 프로토타입 배열을 `client/content/`로 이관
   - `cases.js` `polnet.js` `records.js` `forms.js` `characters.js` `notices.js`
4. **공개/비공개 가르기** — 이 단계의 본론
   - `characters.js` → 이름·직급·역할·`style`만. `persona`는 `server/content/personas/`
   - `forms.js` → `label` `hint`만. `keys` `alts`는 `server/content/answers.js`
   - `records.js` → `locked`/`missing` 항목의 `body`는 `server/content/records.private.js`
   - 판단 기준: **클라이언트에 있으면 F12로 게임이 끝나는가**
5. `content.example/` 축약본 — 폴넷 문서 2, 레코드 2, 양식 1(필드 3), 캐릭터 2
6. `shared/ids.js` — character / record / form id 상수
7. 로더에 폴백: `content/` 없으면 `content.example/`

**완료 기준** `content/`를 지워도 import가 깨지지 않는다

**주의**
- P9(번역)를 생각하면 지금이 **문장을 데이터로 몰아두는 유일한 기회**다. UI에 하드코딩된 한국어("조회 신청", "제출", "발신 전용 계정입니다")도 눈에 띄면 같이 빼둔다. 나중에 하려면 전수 조사가 된다.
- 비공개 파일이 `.gitignore`의 `content/`에 안 걸린다. `server/content/`도 무시 대상에 추가할지 지금 정할 것.

---

## P2 · core + 테스트 + CI

게임 로직을 브라우저 밖으로 꺼낸다.

**브랜치** `feat/core-scheduler` → `feat/core-rules` → `ci/setup`

1. `adapters/clock.js` — `now()`, 테스트용 `advance()`. `TEMPO` 배속도 여기로
2. `core/scheduler.js` — 절대시각 큐, `tick(now)`
   - `{ msg, pushes, db }` 세 종류 예약
   - 복원 시 지나간 예약 당기기
3. `core/rules/chat.js` — 읽기·답장 타이밍, 말풍선 분배, `tailGap`
4. `core/rules/records.js` — `locked` 해금, `missing` 등록
5. `core/rules/story.js` — 분기 이벤트 (유휴 감지, 발설 판정)
6. `core/state.js` `actions.js` `events.js`
7. **테스트** — 손으로 확인하기 비싼 것만
   - 채점: 날짜/번호 표기 변형이 의도대로 통과·실패하는지
   - 스케줄러: `advance(12분)` 후 읽음·답장 상태
   - 복원: 지나간 예약이 당겨지는지
8. `npm run check` 통과 확인
9. **이제** `.github/workflows/ci.yml` 추가. PR에서 `npm run check`
10. Ruleset에 status check 필수 추가
11. 스케줄러 메모를 README에서 `core/scheduler.js` 상단 주석으로 이사

**완료 기준** 브라우저 없이 `npm test` 통과, PR에 초록불

**규칙** `core/`는 DOM과 fetch를 import하지 않는다. 이게 깨지면 테스트가 불가능해지고 P3의 선택지도 사라진다.

---

## P3 · UI

**먼저 결정** — 바닐라로 다시 쓸지, React 유지할지.
P2가 끝난 시점에 정한다. core가 분리돼 있으면 어느 쪽이든 붙는다.

| | 바닐라 | React |
|---|---|---|
| 기간 | 1~2주 | 3~5일 |
| 얻는 것 | DOM·이벤트·렌더링 | 속도 |

**순서** — 쉬운 것부터. 중간에 확인이 된다.

1. `ui/window.js` — 드래그·리사이즈·z-index (프로토타입 `startDrag` 참고)
2. `ui/desktop.js` `taskbar.js` — 아이콘, 포스트잇
3. `ui/login.js` — 제일 단순. 배선 검증용
4. `apps/polnet.js` — 정적
5. `apps/recordsdb.js` — 잠금·신청 상태
6. `apps/collector.js` — 입력·제출
7. `apps/messenger.js` — 제일 복잡. 마지막
8. `boot.js` `landing.js` `toast.js`

**규칙** UI는 `actions.*`를 호출하고 `events.on()`으로 받는다. 상태를 직접 고치지 않는다.

**완료 기준** AI 없이(fallback 대사) 폴넷 → DB → 양식 흐름이 끝까지 돌아간다

---

## P4 · 세이브 + 배포 파이프라인

프론트만 먼저 올린다. **AI를 빼는 게 아니라, 배포가 막혔을 때 원인을 좁히려는 것.** 로컬은 이미 풀 LLM으로 돌아가는 상태다.

**브랜치** `feat/save-local` → `chore/deploy`

1. `adapters/storage/local.js` — `window.storage` → `localStorage`
2. `state_json` 형태 확정 + 버전 필드
   - 나중에 통째로 서버로 옮겨갈 물건이라 지금 구조를 굳혀둔다
   - 창 위치·포스트잇 좌표와 게임 진행을 같은 레벨에 두지 말 것
3. 복원 시 예약 당기기 검증 (P2 테스트가 여기서 값어치 한다)
4. Vercel 연결, `main` 푸시 시 자동 배포
5. README에 데모 링크 + 스크린샷

**완료 기준** 배포된 URL에서 새로고침해도 진행이 이어진다

---

## P5 · AI proxy + 재배포

**브랜치** `feat/api-chat`

1. `adapters/ai/index.js` — 인터페이스 먼저. 구현체는 뒤에
2. `POST /api/chat` 서버리스 함수
   - 받는 것 `{ characterId, history }`
   - 서버가 persona 조립 → LLM 호출 → 검증 → 반환
3. **응답 검증 3종** (빠뜨리기 쉬움)
   - `messages` 개수 자르기
   - `delivers`가 유효한 record id인지 — 안 하면 프롬프트 인젝션으로 임의 해금
   - 마크다운·불릿·이모지 후처리 제거
4. Gemini 구현체. `responseSchema`로 JSON 강제하면 파싱 방어 코드가 사라진다
5. 실패 시 캐릭터 `fallback` 대사로 폴백
6. 재배포

**완료 기준** 키가 프론트 번들에 없고, 캐릭터가 페르소나대로 답한다

여기까지가 개발 배포. URL 하나 생기고 혼자 쓴다. 공개는 한참 뒤.

---

## P6 · 프롬프트 튜닝 · 모델 비교

끝이 없는 구간. 다음으로 넘어갈 만하면 넘어간다.

- 어댑터 덕분에 모델 교체는 구현체만 바꾸면 된다. Gemini / Groq 비교
- 프롬프트가 Claude 기준으로 쓰여 있어 모델 바꾸면 결과가 다르다
  - 말풍선 개수 지시를 덜 지킴 → 서버에서 자르는 방어 유지
  - 서식 금지를 덜 지킴 → 후처리 필터 유지
- `form_submissions` 로그 보면서 채점 기준 조정
- **P8 준비**: 어떤 응답이 사실상 고정인지 관찰해 둔다. 그게 스크립트로 뺄 후보다

---

## P7 · 스토리 재작성 · 콘텐츠 서브모듈화

- `content/`를 프라이빗 서브모듈로 승격
  - **Vercel deploy key 설정에 반나절 잡아둘 것.** CI에서 프라이빗 서브모듈 받는 게 첫 관문
  - 클론 시 `--recursive`, 부모에서도 커밋해야 포인터가 갱신됨
- 사건 1건을 내 이야기로 다시 쓴다
- 문서에 일부러 지저분함 넣기 — 서식 불일치, 오래된 양식 흔적, 담당자 교체 흔적
- 제목 확정

---

## P8 · 하이브리드 대화

비용 대책. 코드는 어댑터 앞 분기 하나.

```js
export async function reply({ characterId, history }) {
  const scripted = matchScript(characterId, lastMessage(history));
  return scripted ?? await callServer({ characterId, history });
}
```

어려운 건 코드가 아니라 **무엇을 스크립트로 뺄지 정하는 것**. P6 관찰 결과에 달렸다.

부수 효과: API가 죽어도 게임이 돌아가고, 응답이 즉각적이라 타이밍 연출이 더 정확해진다.

---

## P9 · 언어 다양화

P1에서 문장을 데이터로 몰아뒀으면 여기가 수월하다. 아니면 전수 조사.

- UI 문자열 / 콘텐츠 / persona 세 층이 각각 번역 대상
- persona는 번역이 아니라 **재작성**에 가깝다. 말투가 캐릭터의 본체라서
- 한국 관공서 문서 양식이 번역되면 무너지는 부분이 있다. 어디까지 현지화할지 먼저 정할 것

---

## P10 · 계정 · 서버 세이브

**브랜치** `feat/auth`

1. `users` `sessions` 먼저
2. 익명 세션 — 첫 요청에 UUID 쿠키 발급. 로그인 UI 없이
3. 가입 시 익명 계정에 이메일을 붙이는 형태 → 진행상황 승계
4. `playthroughs` 서버 이관, `adapters/storage/server.js`
5. `chat_messages` `form_submissions` `record_access` 분리
6. ER 다이어그램을 `docs/`에 정리

**설계** 콘텐츠는 파일, 진행만 DB. `character_id` `record_id` `form_id`는 FK가 아니라 파일을 가리키는 문자열 키.

---

## P11 · 레이트 리밋 · 비용 가드

공개하기 직전에 한다. 개발 중엔 자기가 막혀서 방해만 된다.

- 세션/IP당 일일 콜 제한
- `api_usage` 기록 — 무료 티어 소진 추적
- 초과 시 안내를 게임 톤으로 ("회선이 혼잡합니다")
- 없이 URL이 돌아다니면 무료 티어가 하루면 날아간다

---

## P12 · itch.io 공개

- **데모 또는 Early Access로 명시.** 기대치를 맞추면 짧은 게 단점이 아니다
- 사건 3건 어중간한 것보다 1건 밀도 높은 게 낫다
- 스크린샷 필수
- 라이선스 결정 — 코드와 콘텐츠를 나눈다 (코드 MIT / 콘텐츠 별도)

---

## 전역 규칙

- `core/`는 DOM·fetch를 모른다
- 시간은 `clock.now()`로 주입받는다
- UI는 상태를 직접 고치지 않는다
- persona·정답·미해금 본문은 서버에만
- 커밋 하나 = 변경 하나. 메시지는 무엇을 왜 바꿨는지