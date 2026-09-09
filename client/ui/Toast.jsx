import S from './strings.js';
import { useGame } from './GameProvider.jsx';

export function Toast({ onOpenChat }) {
  const { toast, dismissToast } = useGame();
  if (!toast) return null;

  const clickable = toast.kind === 'msg' && !!onOpenChat;

  return (
    <div
      onClick={() => {
        if (!clickable) return;
        onOpenChat(toast.cid);
        dismissToast();
      }}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 52,
        width: 300,
        background: '#1F272D',
        color: '#E4EAEE',
        border: '1px solid #3A464F',
        borderLeft: `3px solid ${toast.kind === 'msg' ? '#7FA8C4' : '#6E7C85'}`,
        padding: '11px 16px',
        fontSize: 12.5,
        lineHeight: 1.55,
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: '0 6px 20px rgba(0,0,0,.45)',
        zIndex: 9998,
      }}
    >
      {toast.kind === 'msg' ? (
        <>
          <div>{S.toast.messageArrived}</div>
          <div style={{ fontSize: 11, color: '#9DAAB3', marginTop: 4 }}>{toast.who}</div>
        </>
      ) : (
        toast.text
      )}
    </div>
  );
}