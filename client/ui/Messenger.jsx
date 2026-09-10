import { useEffect, useRef, useState } from 'react';
import { TRAIT } from '../../shared/enums.js';
import S from './strings.js';
import { fmt } from './format.js';
import { useGame } from './GameProvider.jsx';

const clockStr = (ts) => {
  const d = new Date(ts);
  const h = d.getHours();
  return `${h < 12 ? S.clock.am : S.clock.pm} ${((h + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const has = (c, trait) => (c.traits ?? []).includes(trait);

export function Messenger({ chatRequest, watching }) {
  const { content, actions, chats, typing, seenAt, outsider } = useGame();
  const T = content.systems.msg;

  // 최근 연락순. 대화가 없는 사람은 뒤로, 그 안에서는 콘텐츠 순서.
  const lastAt = (cid) => {
    const log = chats[cid] ?? [];
    return log.length ? log.at(-1).at : 0;
  };
  const roster = content.characters
    .filter((c) => !has(c, TRAIT.HIDDEN) || outsider !== 'hidden')
    .map((c, i) => ({ c, i }))
    .sort((a, b) => lastAt(b.c.id) - lastAt(a.c.id) || a.i - b.i)
    .map((x) => x.c);

  const [active, setActive] = useState(roster[0]?.id);
  const ch = content.characters.find((c) => c.id === active) ?? roster[0];
  const log = chats[ch.id] ?? [];
  const end = useRef(null);
  const [text, setText] = useState('');

  const unread = (cid) => {
    const since = seenAt[cid] ?? 0;
    return (chats[cid] ?? []).filter((m) => !m.me && m.at > since).length;
  };

  // 토스트에서 열면 그 대화로 옮긴다.
  useEffect(() => {
    if (chatRequest?.cid) setActive(chatRequest.cid);
  }, [chatRequest]);

  // 이 창이 떠 있는 동안만 '보고 있는 대화'다. 최소화하면 언마운트되며 지워진다.
  useEffect(() => {
    if (!watching) return;
    watching.current = ch.id;
    return () => {
      watching.current = null;
    };
  }, [watching, ch.id]);

  useEffect(() => {
    actions.markSeen(ch.id);
  }, [actions, ch.id, log.length]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length, typing[ch.id], ch.id]);

  const burned = has(ch, TRAIT.BURNABLE) && outsider === 'burned';
  const broadcast = has(ch, TRAIT.BROADCAST);

  const submit = () => {
    if (!text.trim()) return;
    actions.send(ch.id, text.trim());
    setText('');
  };

  return (
    <div className="split">
      <div className="msg-roster">
        <div className="msg-roster-head px">{content.TEAM}</div>

        {roster.map((c) => {
          const n = unread(c.id);
          const gone = has(c, TRAIT.BURNABLE) && outsider === 'burned';
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={
                'msg-person' + (active === c.id ? ' is-active' : '') + (n > 0 ? ' has-unread' : '')
              }
            >
              <div className="msg-avatar" style={{ background: c.tint }}>
                {c.name[0]}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div className={`msg-person-name${gone ? ' is-gone' : ''}`}>
                  {c.name} <span className="msg-person-rank">{c.rank}</span>
                </div>
                <div className="msg-person-role">{c.role}</div>
              </div>

              {n > 0 && <span className="msg-badge">{n > 99 ? '99+' : n}</span>}
            </button>
          );
        })}
      </div>

      <div className="msg-pane">
        <div className="msg-head">
          <span>
            {ch.name} {ch.rank}
          </span>
        </div>

        <div className="msg-log">
          {log.map((m, i) => (
            <div key={i} className={`msg-row${m.me ? ' is-mine' : ''}`}>
              {m.me && (
                <div className="msg-stamp">
                  {!m.read && <div className="msg-unreadmark">1</div>}
                  <div>{clockStr(m.at)}</div>
                </div>
              )}

              <div className="msg-bubble">{m.text}</div>

              {!m.me && <div className="msg-stamp">{clockStr(m.at)}</div>}
            </div>
          ))}

          {typing[ch.id] && (
            <div className="msg-typing">{fmt(S.messenger.typing, { name: ch.name })}</div>
          )}
          <div ref={end} />
        </div>

        {burned || broadcast ? (
          <div className="msg-closed">{burned ? T.burned : T.broadcastOnly}</div>
        ) : (
          <div className="msg-input">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={S.messenger.inputPlaceholder}
            />
            <button className="btn msg-send" onClick={submit}>
              {S.messenger.send}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}