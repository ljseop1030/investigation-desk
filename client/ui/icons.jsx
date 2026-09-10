// 앱 정의는 content/screen/apps.js에 있고 거긴 JSX를 담을 수 없다.
// 그림만 여기 두고 app.id로 꺼낸다.
//
// 32x32 격자에 정수 좌표만 쓴다. shapeRendering="crispEdges"로 안티에일리어싱을
// 끄기 때문에 소수점 좌표를 넣으면 그 획만 흐려진다.
// 색은 아이콘당 네 개 이하. 그 시절 아이콘은 팔레트가 좁았고, 그 좁음이 룩의 본체다.
//
// 은유는 보편적인 물건이 아니라 이 기관이 실제로 쓰는 물건에서 가져온다.
// 지구본이 아니라 게시판, 원통이 아니라 캐비닛.

const svg = (children) => (
  <svg viewBox="0 0 32 32" width="48" height="48" shapeRendering="crispEdges" aria-hidden="true">
    {children}
  </svg>
);

// 폴넷 — 압정 꽂힌 게시판. 인트라넷은 인터넷이 아니다.
const polnet = svg(
  <>
    <rect x="3" y="4" width="26" height="22" fill="#000000" />
    <rect x="4" y="5" width="24" height="20" fill="#7A5C3A" />
    <rect x="6" y="8" width="9" height="12" fill="#000000" />
    <rect x="6" y="8" width="8" height="11" fill="#EDEAE0" />
    <rect x="17" y="8" width="9" height="12" fill="#000000" />
    <rect x="17" y="8" width="8" height="11" fill="#EDEAE0" />
    <rect x="8" y="11" width="4" height="1" fill="#8A8478" />
    <rect x="8" y="14" width="4" height="1" fill="#8A8478" />
    <rect x="19" y="11" width="4" height="1" fill="#8A8478" />
    <rect x="19" y="14" width="4" height="1" fill="#8A8478" />
    <rect x="9" y="6" width="2" height="2" fill="#A63D26" />
    <rect x="20" y="6" width="2" height="2" fill="#A63D26" />
    <rect x="4" y="26" width="24" height="2" fill="#3E3020" />
  </>
);

// 수사자료 DB — 서류철 캐비닛. 그 시절 감각으로 자료 보관은 이 모양이다.
const db = svg(
  <>
    <rect x="5" y="3" width="22" height="26" fill="#000000" />
    <rect x="6" y="4" width="20" height="24" fill="#8A939B" />
    <rect x="6" y="4" width="20" height="1" fill="#C4CBD1" />
    <rect x="6" y="4" width="1" height="24" fill="#C4CBD1" />
    <rect x="8" y="7" width="16" height="8" fill="#5E6B75" />
    <rect x="8" y="18" width="16" height="8" fill="#5E6B75" />
    <rect x="13" y="10" width="6" height="2" fill="#DDE0E4" />
    <rect x="13" y="21" width="6" height="2" fill="#DDE0E4" />
  </>
);

// 자료취합 — 칸이 그어진 양식지.
const form = svg(
  <>
    <rect x="5" y="2" width="22" height="28" fill="#000000" />
    <rect x="6" y="3" width="20" height="26" fill="#F7F8F9" />
    <rect x="8" y="5" width="16" height="3" fill="#2B4257" />
    <rect x="8" y="11" width="16" height="14" fill="#98A2AB" />
    <rect x="9" y="12" width="14" height="12" fill="#FFFFFF" />
    <rect x="9" y="16" width="14" height="1" fill="#98A2AB" />
    <rect x="9" y="20" width="14" height="1" fill="#98A2AB" />
    <rect x="14" y="12" width="1" height="12" fill="#98A2AB" />
  </>
);

// 업무 메신저 — 창 두 개가 겹친 모양. 사내 메신저 아이콘이 실제로 이랬다.
const msg = svg(
  <>
    <rect x="3" y="6" width="18" height="14" fill="#000000" />
    <rect x="4" y="7" width="16" height="12" fill="#DDE0E4" />
    <rect x="4" y="7" width="16" height="3" fill="#4F7A63" />
    <rect x="6" y="12" width="10" height="1" fill="#5C666F" />
    <rect x="6" y="15" width="7" height="1" fill="#5C666F" />
    <rect x="11" y="13" width="18" height="14" fill="#000000" />
    <rect x="12" y="14" width="16" height="12" fill="#F2F3F5" />
    <rect x="12" y="14" width="16" height="3" fill="#2B4257" />
    <rect x="14" y="19" width="11" height="1" fill="#5C666F" />
    <rect x="14" y="22" width="8" height="1" fill="#5C666F" />
  </>
);

const fallback = svg(
  <>
    <rect x="5" y="4" width="22" height="24" fill="#000000" />
    <rect x="6" y="5" width="20" height="22" fill="#5E6B75" />
    <rect x="6" y="5" width="20" height="1" fill="#B7C4CD" />
  </>
);

const ICONS = { polnet, db, form, msg };

export const iconFor = (appId) => ICONS[appId] ?? fallback;