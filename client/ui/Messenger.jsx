import { useEffect, useRef, useState } from 'react';
import { TRAIT } from '../../shared/enums.js';
import { C, SANS, btnPrimary } from './style.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

const clockStr = (ts) => {
  const d = new Date(ts);
  const h = d.getHours();
  return `${h < 12 ? S.clock.am : S.clock.pm} ${((h + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const has = (c, trait) => (c.traits ?? []).includes(trait);

export function Messenger() {
  const { content, actions, chats, typing, seenAt, outsider } = useGame();

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

  // 보고 있는 대화는 계속 본 것으로 친다.
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
    <div style={{ display: 'flex', width: '100%', fontSize: 13 }}>
      <div style={{ width: 174, borderRight: `1px solid ${C.line}`, background: '#EDEFF1', overflowY: 'auto' }}>
        <div style={{ padding: '9px 12px', fontSize: 11, color: C.inkSoft, borderBottom: `1px solid ${C.line}` }}>
          {content.TEAM}
        </div>

        {roster.map((c) => {
          const n = unread(c.id);
          const gone = has(c, TRAIT.BURNABLE) && outsider === 'burned';
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                padding: '9px 10px',
                border: 'none',
                borderBottom: '1px solid #E2E5E8',
                background: active === c.id ? '#fff' : n > 0 ? '#E4EAEE' : 'transparent',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: c.tint,
                  color: '#fff',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {c.name[0]}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: n > 0 ? 700 : 400, color: gone ? C.hint : C.ink }}>
                  {c.name} <span style={{ color: C.inkSoft, fontSize: 10.5 }}>{c.rank}</span>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: C.inkSoft,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.role}
                </div>
              </div>

              {n > 0 && (
                <span
                  style={{
                    background: '#C4452C',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    minWidth: 18,
                    height: 18,
                    lineHeight: '18px',
                    borderRadius: 9,
                    textAlign: 'center',
                    padding: '0 5px',
                    flexShrink: 0,
                  }}
                >
                  {n > 99 ? '99+' : n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#DCE3E8' }}>
        <div style={{ padding: '7px 12px', background: '#fff', borderBottom: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 13 }}>
            {ch.name} {ch.rank}
          </span>
          <span style={{ fontSize: 10.5, color: C.barDim, float: 'right', marginTop: 3 }}>{ch.tag}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {log.map((m, i) => (
            <div
              key={i}
              style={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start', marginBottom: 7 }}
            >
              {m.me && (
                <div
                  style={{
                    fontSize: 9.5,
                    color: '#7B8A96',
                    alignSelf: 'flex-end',
                    marginRight: 5,
                    textAlign: 'right',
                  }}
                >
                  {!m.read && <div style={{ color: C.alert }}>1</div>}
                  <div>{clockStr(m.at)}</div>
                </div>
              )}

              <div
                style={{
                  maxWidth: '74%',
                  background: m.me ? C.mine : '#fff',
                  padding: '7px 11px',
                  fontSize: 12.5,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  borderRadius: 3,
                  color: C.ink,
                }}
              >
                {m.text}
              </div>

              {!m.me && (
                <div style={{ fontSize: 9.5, color: '#7B8A96', alignSelf: 'flex-end', marginLeft: 5 }}>
                  {clockStr(m.at)}
                </div>
              )}
            </div>
          ))}

          {typing[ch.id] && (
            <div style={{ fontSize: 11, color: '#6E7B85', padding: '2px 4px' }}>{S.messenger.typing(ch.name)}</div>
          )}
          <div ref={end} />
        </div>

        {burned || broadcast ? (
          <div
            style={{
              borderTop: `1px solid ${C.line}`,
              background: '#F2F3F5',
              padding: '16px 14px',
              fontSize: 11.5,
              color: C.inkSoft,
              textAlign: 'center',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {burned ? S.messenger.burned : S.messenger.broadcastOnly}
          </div>
        ) : (
          <div style={{ display: 'flex', borderTop: `1px solid ${C.line}`, background: '#fff' }}>
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
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '10px 12px',
                fontSize: 12.5,
                fontFamily: SANS,
                resize: 'none',
                height: 52,
              }}
            />
            <button onClick={submit} style={{ ...btnPrimary, width: 62, height: 52 }}>
              {S.messenger.send}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}