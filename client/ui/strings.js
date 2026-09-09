// UI 문구. 시나리오와 무관한 인터페이스 텍스트.
// P9에서 여기만 번역하면 된다. 세계관 텍스트는 content/에 있다.

export default {
  common: {
    submit: '제출',
    resubmit: '다시 제출',
    confirm: '확인',
    back: '뒤로',
    login: '로그인',
    newGame: '처음부터',
  },

  landing: {
    continue: '이어서',
    about: '게임 정보',
    noSave: '저장된 작업 없음',
    namePlaceholder: '사용자 이름',
    loading: '이전 작업 상태를 불러오는 중…',
  },

  boot: {
    preparing: '바탕화면을 준비하는 중…',
    skip: '화면을 누르면 건너뜁니다',
  },

  login: {
    idPlaceholder: '아이디',
    pwPlaceholder: '비밀번호',
    failed: '아이디 또는 비밀번호가 올바르지 않습니다.',
    failedCount: (n, max) =>
      `아이디 또는 비밀번호가 올바르지 않습니다. (${n}/${max}회, ${max}회 실패 시 계정이 잠깁니다)`,
    helpdesk: '계정 문의는 서무 담당(내선 3109)',
  },

  desktop: {
    hint: '바탕화면 아이콘을 두 번 눌러 실행하십시오.',
    resetConfirm: '저장된 진행 상황을 모두 지우고 처음부터 다시 시작합니다.',
    terminal: (tag) => `AUX TERMINAL ${tag} / 대여`,
    user: (name) => `USER ${name}`,
    caseCount: (n) => `병행사건 ${n}건`,
  },

  polnet: {
    posted: (team) => `${team} · 게시`,
  },

  db: {
    allRecords: '전체 자료',
    categorySuffix: '자료',
    unregistered:
      '등록된 자료가 없습니다.\n해당 자료는 작성 담당자가 등록한 시점부터 조회할 수 있습니다.',
    pending: '조회 신청이 접수되었습니다. 승인 대기 중입니다.',
    reasonPlaceholder: '조회 사유 (사건번호 및 용도)',
    requestButton: '조회 신청',
    logged: '조회 이력은 계정별로 기록됩니다.',
  },

  collector: {
    listTitle: '배정된 양식',
    listSubtitle: (team) => `${team} · 보조인력 계정`,
    listGuide: '병행 중인 사건이 여러 건입니다. 자료를 옮겨 적기 전에 사건번호를 대조하십시오.',
    backToList: '← 양식 목록',
    requestedBy: (who, due) => `요청 ${who} · 기한 ${due}`,
    deadline: (due) => `기한 ${due}`,

    statusDraft: (filled, total) => `작성 중 ${filled}/${total}`,
    statusReview: '검토 중',
    statusDone: '완료',
    statusRejected: (n) => `반려 · 미비 ${n}건`,

    reviewBanner: '제출됨. 검토 중입니다.',
    acceptedTitle: '접수 완료',
    acceptedBody: '정리표가 접수되었습니다. 수고하셨습니다.',
    rejectedTitle: (n) => `반려 — 미비 ${n}건`,
    rejectedBody: '표시된 항목을 보완하여 다시 제출하십시오.',

    fieldBad: '미비',
    fieldOk: '확인',
  },

  messenger: {
    inputPlaceholder: '메시지 입력 (Enter 전송)',
    send: '전송',
    typing: (name) => `${name} 님이 입력 중…`,
    broadcastOnly:
      '발신 전용 계정입니다. 회신할 수 없습니다.\n문의는 각 담당부서로 연락하시기 바랍니다.',
    burned:
      '이 대화 상대를 찾을 수 없습니다.\n등록되지 않은 계정과의 대화는 보관되지 않습니다.',
  },

  toast: {
    messageArrived: '메시지가 도착했습니다.',
    dbRegistered: (title) => `수사자료 DB 등록: ${title}`,
    dbApproved: (title) => `조회 승인: ${title}`,
    requestReceived: '조회 신청이 접수되었습니다.',
    formAccepted: (title) => `${title} 접수 완료`,
    formRejected: (title, n) => `${title} 반려 — 미비 ${n}건`,
    contactNotFound: '대화 상대를 찾을 수 없습니다.',
    noticeAlwaysShown: '필수 공지는 매 부팅 시 표시됩니다.',
  },

  notice: {
    dontShowAgain: '다시 보지 않기',
  },

  clock: {
    am: '오전',
    pm: '오후',
  },
};