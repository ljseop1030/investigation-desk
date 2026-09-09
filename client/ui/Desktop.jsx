import { useState } from 'react';
import { C, SANS, MONO } from './style.js';
import S from './strings.js';
import { iconFor } from './icons.jsx';
import { Window } from './Window.jsx';
import { PostIt } from './PostIt.jsx';
import { DesktopIcon } from './DesktopIcon.jsx';
import { Taskbar } from './Taskbar.jsx';

// 창 안에 무엇을 그릴지는 renderApp이 정한다. Desktop은 배치만 안다.
export function Desktop({ apps, status, screen: sc, renderApp, onReset }) {
  const [selIcon, setSelIcon] = useState(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(circle at 28% -10%, #22303A, ${C.screen} 68%)`,
        overflow: 'hidden',
        fontFamily: SANS,
      }}
    >
      <div
        onMouseDown={(e) => e.target === e.currentTarget && setSelIcon(null)}
        style={{ position: 'absolute', inset: 0 }}
      >
        {apps.map((a) => (
          <DesktopIcon
            key={a.id}
            app={{ ...a, icon: iconFor(a.id) }}
            pos={sc.icons[a.id]}
            selected={selIcon === a.id}
            onSelect={() => setSelIcon(a.id)}
            onOpen={() => sc.open(a)}
            onMove={(x, y) => sc.moveIcon(a.id, x, y)}
          />
        ))}

        {status && (
          <div
            style={{
              position: 'absolute',
              left: 16,
              bottom: 54,
              color: '#586873',
              fontSize: 10.5,
              lineHeight: 1.75,
              fontFamily: MONO,
            }}
          >
            <div>{S.desktop.terminal(status.assetTag)}</div>
            {status.user ? <div>{S.desktop.user(status.user)}</div> : null}
            <div>{S.desktop.caseCount(status.caseCount)}</div>
          </div>
        )}
      </div>

      {sc.notes.map((n, i) => (
        <PostIt
          key={n.id ?? i}
          note={n}
          z={n.z}
          onFocus={() => sc.raiseNote(i)}
          onDrag={(r, y) => sc.moveNote(i, r, y)}
        />
      ))}

      {sc.wins.map((w) => (
        <Window
          key={w.id}
          win={w}
          focused={sc.top === w.id}
          onFocus={() => sc.focus(w.id)}
          onClose={() => sc.close(w.id)}
          onMin={() => sc.minimize(w.id)}
          onDrag={(x, y) => sc.move(w.id, x, y)}
          onResize={(cw, ch) => sc.resize(w.id, cw, ch)}
        >
          {renderApp(apps.find((a) => a.id === w.id))}
        </Window>
      ))}

      <Taskbar wins={sc.wins} top={sc.top} onFocus={sc.focus} onReset={onReset} />
    </div>
  );
}