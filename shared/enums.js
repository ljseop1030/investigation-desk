// 코드가 쓰는 어휘. 캐릭터·사건·자료는 여기 없다. 그건 콘텐츠다.

// 수사자료 접근 상태
export const ACCESS = {
  OPEN: 'open', // 바로 열람 가능 (승인됨, 등록됨)
  RESTRICTED: 'restricted',       // 조회 사유 신청 -> 승인 후 열람
  UNREGISTERED: 'unregistered',   // 아직 DB에 없음. 담당자(다른 캐릭터)가 등록해야 함
  NONE: 'none',                   // DB에 올라올 일이 없음. 담당자가 말로만 준다
};

// 자료를 건네는 방식. access에서 파생된다 — 필드가 아니라 계산값이다.
// UNREGISTERED는 DB에 올라가고, NONE은 말로만 간다. 둘 다 수령 기록은 남는다.
export const DELIVERY = {
  REGISTER: 'register',
  TELL: 'tell',
};

// 양식 제출 상태
export const STATUS = {
  DRAFT: 'draft', // 아직 작성 중
  REVIEW: 'review', // 제출 후 대기 중
  DONE: 'done', // 완료
};

// 캐릭터 성질. 코드 경로가 갈리는 것만 여기 넣는다.
export const TRAIT = {
  HIDDEN: 'hidden',         // 조건 충족 전까지 명단에 안 보임
  BROADCAST: 'broadcast',   // 발신 전용. 입력창 대신 안내문
  EXTERNAL: 'external',     // 정식 경로 밖. 발설 판정 대상
  BURNABLE: 'burnable',     // 소각 가능 (대화 차단됨)
};