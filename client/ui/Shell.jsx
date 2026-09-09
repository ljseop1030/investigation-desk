import { useState } from 'react';
import { useScreen } from './screen.js';
import { Desktop } from './Desktop.jsx';
import { AppFrame } from './AppFrame.jsx';
import { Toast } from './Toast.jsx';

// 창 상태를 들고 있는 자리. Desktop 안에 두면 토스트가 창을 열 수 없다.
export function Shell({ apps, notes, status, chatAppId, watching, onReset }) {
  const screen = useScreen({ apps, notes });
  // nonce가 있어야 같은 대화를 두 번 눌러도 다시 열린다.
  const [chatRequest, setChatRequest] = useState(null);

  const openChat = (cid) => {
    const app = apps.find((a) => a.id === chatAppId);
    if (app) screen.open(app);
    setChatRequest((r) => ({ cid, n: (r?.n ?? 0) + 1 }));
  };

  return (
    <>
      <Desktop
        apps={apps}
        status={status}
        screen={screen}
        onReset={onReset}
        renderApp={(app) => (
          <AppFrame app={app} chatRequest={chatRequest} watching={watching} />
        )}
      />
      <Toast onOpenChat={openChat} />
    </>
  );
}