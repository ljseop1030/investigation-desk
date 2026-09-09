// 앱 정의는 content/screen/apps.js에 있고 거긴 JSX를 담을 수 없다.
// 그림만 여기 두고 app.id로 꺼낸다.
const polnet = (
  <svg viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="15" fill="#33566E" stroke="#8FB4C9" strokeWidth="1.5" />
    <ellipse cx="20" cy="20" rx="6.5" ry="15" fill="none" stroke="#CDE3EE" strokeWidth="1.2" />
    <path d="M5.6 15h28.8M5.6 25h28.8" stroke="#CDE3EE" strokeWidth="1.2" />
  </svg>
);

const db = (
  <svg viewBox="0 0 40 40" width="40" height="40">
    <ellipse cx="20" cy="9" rx="13" ry="4.5" fill="#5E6B75" stroke="#B7C4CD" strokeWidth="1.2" />
    <path d="M7 9v22c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5V9" fill="#6E7C87" stroke="#B7C4CD" strokeWidth="1.2" />
    <path d="M7 20c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5" fill="none" stroke="#B7C4CD" strokeWidth="1.2" />
  </svg>
);

const form = (
  <svg viewBox="0 0 40 40" width="40" height="40">
    <rect x="7" y="4" width="26" height="32" fill="#F2F3F4" stroke="#8A939B" strokeWidth="1.3" />
    <rect x="13" y="2" width="14" height="5" rx="1" fill="#8A939B" />
    <path d="M12 14h16M12 19h16M12 24h16M20 12v16" stroke="#9AA4AC" strokeWidth="1" />
  </svg>
);

const msg = (
  <svg viewBox="0 0 40 40" width="40" height="40">
    <path d="M5 8h30v20H20l-8 7v-7H5z" fill="#4F7A63" stroke="#B6D4C1" strokeWidth="1.3" />
    <circle cx="14" cy="18" r="2" fill="#E9F3ED" />
    <circle cx="20" cy="18" r="2" fill="#E9F3ED" />
    <circle cx="26" cy="18" r="2" fill="#E9F3ED" />
  </svg>
);

const fallback = (
  <svg viewBox="0 0 40 40" width="40" height="40">
    <rect x="7" y="6" width="26" height="28" fill="#5E6B75" stroke="#B7C4CD" strokeWidth="1.3" />
  </svg>
);

const ICONS = { polnet, db, form, msg };

export const iconFor = (appId) => ICONS[appId] ?? fallback;