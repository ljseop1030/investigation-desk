import { useState } from 'react';
import { fmt } from './format.js';
import { useGame } from './GameProvider.jsx';
import { iconFor } from './icons.jsx';
import { Window } from './Window.jsx';
import { PostIt } from './PostIt.jsx';
import { DesktopIcon } from './DesktopIcon.jsx';
import { Taskbar } from './Taskbar.jsx';

// 창 안에 무엇을 그릴지는 renderApp이 정한다. Desktop은 배치만 안다.
export function Desktop({ apps, icons, status, screen: sc, renderApp, onRestart, onQuit }) {
  const { content } = useGame();
  const [selIcon, setSelIcon] = useState(null);
  const shown = icons ?? apps;
  const st = content.terminal.desktopStatus;

  return (
    <div className="desk on-dark">
      <div
        className="desk-layer"
        onMouseDown={(e) => e.target === e.currentTarget && setSelIcon(null)}
      >
        {shown.map((a) => (
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
          <div className="desk-status">
            <div>{fmt(st.terminal, { tag: status.assetTag })}</div>
            {status.user ? <div>{fmt(st.user, { name: status.user })}</div> : null}
          </div>
        )}
      </div>

      {sc.notes.map((n) => (
        <PostIt
          key={n.id}
          note={n}
          z={n.z}
          onFocus={() => sc.raiseNote(n.id)}
          onDrag={(r, y) => sc.moveNote(n.id, r, y)}
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

      <Taskbar wins={sc.wins} top={sc.top} onFocus={sc.focus} onRestart={onRestart} onQuit={onQuit} />
    </div>
  );
}