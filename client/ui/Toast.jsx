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
      className={`toast px${clickable ? ' is-clickable' : ''}`}
    >
      {toast.kind === 'msg' ? (
        <>
          <div>{S.toast.messageArrived}</div>
          <div className="toast-who">{toast.who}</div>
        </>
      ) : (
        toast.text
      )}
    </div>
  );
}
