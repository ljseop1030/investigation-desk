import { useEffect, useState } from 'react';
import { useScreen } from './screen.js';
import { Desktop } from './Desktop.jsx';
import { AppFrame } from './AppFrame.jsx';
import { DeviceNotice } from './DeviceNotice.jsx';
import { Toast } from './Toast.jsx';

// 부팅 직후 뜨는 필수 공지. 앱이 아니라 창만 빌린다.
const NOTICE_WIN = { id: '__notice', w: 500, h: 470 };

export function Shell({ apps, notes, status, terminal, chatAppId, watching, savedScreen, screenRef, onReset }) {
  const screen = useScreen({ apps, notes, saved: savedScreen });
  const [chatRequest, setChatRequest] = useState(null);

  // 자동 저장이 밖에서 화면 배치를 걷어갈 수 있게 창구를 열어둔다.
  // 매 렌더마다 최신 클로저로 갈아끼운다.
  useEffect(() => {
    if (screenRef) screenRef.current = screen.snapshot;
  });

  const noticeApp = { ...NOTICE_WIN, title: terminal.deviceNotice.title };
  useEffect(() => {
    screen.open(noticeApp);
    // 부팅 때 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = (cid) => {
    const app = apps.find((a) => a.id === chatAppId);
    if (app) screen.open(app);
    setChatRequest((r) => ({ cid, n: (r?.n ?? 0) + 1 }));
  };

  return (
    <>
      <Desktop
        apps={[...apps, noticeApp]}
        icons={apps}
        status={status}
        screen={screen}
        onReset={onReset}
        renderApp={(app) =>
          app.id === NOTICE_WIN.id ? (
            <DeviceNotice notice={terminal.deviceNotice} onClose={() => screen.close(NOTICE_WIN.id)} />
          ) : (
            <AppFrame app={app} chatRequest={chatRequest} watching={watching} />
          )
        }
      />
      <Toast onOpenChat={openChat} />
    </>
  );
}