// 언제 저장할지.
//
// 예약은 scheduler 안에 있어서 React가 모른다. 답장 하나가 큐에 들어가도
// 화면이 안 바뀌니 '변화가 있을 때 저장'만으로는 안 잡힌다. 그래서 주기적으로
// 스냅숏을 떠보고, 지난번과 글자 하나라도 다르면 그때 쓴다.
// 더러움 플래그를 손으로 관리하는 것보다 이쪽이 틀릴 여지가 적다.

const EVERY = 3000;

export function createAutosave({ state, scheduler, storage, getScreen, everyMs = EVERY }) {
  let last = null;
  let timer = null;

  const serialize = () => {
    state.setScreen(getScreen?.() ?? {});
    return JSON.stringify(state.snapshot(scheduler.pending()));
  };

  // force면 내용이 같아도 쓴다. 창 닫힐 때 쓰는 길.
  const flush = (force = false) => {
    let json;
    try {
      json = serialize();
    } catch {
      return false;                 // 직렬화 못 할 것이 들어갔다. 다음 판에 다시.
    }
    if (!force && json === last) return false;
    const r = storage.save(json);
    if (r.ok) last = json;
    return r.ok;
  };

  function onLeave() {
    flush(true);
  }
  function onHide() {
    if (document.visibilityState === 'hidden') flush(true);
  }

  const start = () => {
    if (timer) return;
    timer = setInterval(() => flush(false), everyMs);

    // 탭을 닫거나 숨길 때. pagehide는 모바일에서 unload보다 확실하다.
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', onHide);
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
    window.removeEventListener('pagehide', onLeave);
    document.removeEventListener('visibilitychange', onHide);
  };

  return { start, stop, flush, bytes: () => last?.length ?? 0 };
}