// 앱 크롬. 시나리오를 통째로 갈아엎어도 그대로 남는 인터페이스 문구만 둔다.
// P9에서 여기만 번역하면 된다.
//
// 여기 없는 것
//   극중 시스템이 하는 말 (조회 신청, 반려 사유, 발신 전용 안내) → content/screen/systems.js
//   세계관 사실 (자산번호, 내선번호, 기관명)                     → content/screen/terminal.js
// 판별 질문은 하나다. 시나리오가 바뀌어도 이 문장이 그대로 남아도 되는가.
//
// 값은 전부 문자열이다. {name} 자리는 format.js의 fmt()가 채운다.
// 여기에 함수를 다시 들이면 P9에서 파일을 통째로 넘길 수 없다.

export default {
  common: {
    submit: '제출',
    resubmit: '다시 제출',
    confirm: '확인',
    back: '뒤로',
    login: '로그인',
    newGame: '처음부터',
    settings: '설정',
    quit: '종료하기',
  },

  landing: {
    continue: '이어서',
    about: '게임 정보',
    noSave: '저장된 작업 없음',
    namePlaceholder: '사용자 이름',
    loading: '이전 작업 상태를 불러오는 중…',
  },

  // 부팅 로그 자체는 단말이 하는 말이라 content/screen/terminal.js에 있다.
  // 이 한 줄만 게임이 플레이어에게 하는 말이다.
  boot: {
    skip: '화면을 누르면 건너뜁니다',
  },

  login: {
    idPlaceholder: '아이디',
    pwPlaceholder: '비밀번호',
    failed: '아이디 또는 비밀번호가 올바르지 않습니다.',
    failedCount:
      '아이디 또는 비밀번호가 올바르지 않습니다. ({n}/{max}회, {max}회 실패 시 계정이 잠깁니다)',
  },

  desktop: {
    hint: '바탕화면 아이콘을 두 번 눌러 실행하십시오.',
    start: '시작',
    // 확인 문구는 한 번 더 누르면 실행된다는 사실까지 문장 안에 담는다.
    // 별도 안내를 옆에 붙이면 두 줄이 되고, 타자로 찍히는 맛이 죽는다.
    resetConfirm: '저장된 진행 상황을 모두 지웁니다. 한 번 더 누르면 실행됩니다.',
    quitConfirm: '작업을 저장하고 시작 화면으로 나갑니다. 한 번 더 누르면 실행됩니다.',
  },

  polnet: {
    posted: '{team} · 게시',
  },

  db: {
    allRecords: '전체 자료',
    categorySuffix: '자료',
  },

  collector: {
    listTitle: '배정된 양식',
    backToList: '← 양식 목록',
    requestedBy: '요청 {who}',
  },

  messenger: {
    inputPlaceholder: '메시지 입력 (Enter 전송)',
    send: '전송',
    typing: '{name} 님이 입력 중…',
  },

  toast: {
    messageArrived: '메시지가 도착했습니다.',
  },

  notice: {
    dontShowAgain: '다시 보지 않기',
  },

  clock: {
    am: '오전',
    pm: '오후',
  },

  // 게임이 자기 자신에 대해 하는 말. 세계관 텍스트가 아니라 여기 있어야 한다.
  // P4에서 참이 되고, P10에서 서버 세이브가 붙으면 다시 고친다.
  meta: {
    autosave: '진행 상황은 이 브라우저에 자동 저장됩니다.',
  },
};