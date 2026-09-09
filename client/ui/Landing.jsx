import { useEffect, useState } from 'react';
import { MONO } from './style.js';
import S from './strings.js';

export function Landing({ terminal, name, setName, hasSave, onContinue, onNew }) {
  const [line, setLine] = useState(0);
  const [info, setInfo] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLine((n) => (n + 1) % terminal.setupLines.length), 2600);
    return () => clearInterval(t);
  }, [terminal.setupLines.length]);

  const item = (label, on, enabled = true, note) => (
    <button
      key={label}
      onClick={enabled ? on : undefined}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderTop: '1px solid #232C33',
        padding: '13px 4px',
        cursor: enabled ? 'pointer' : 'default',
        color: enabled ? '#D7DFE4' : '#4B565E',
        fontSize: 14,
        fontFamily: MONO,
        textAlign: 'left',
      }}
    >
      <span style={{ color: enabled ? '#7FA0B5' : '#39434A', fontSize: 12 }}>▸</span>
      <span>{label}</span>
      {note && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4E5A63' }}>{note}</span>}
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0E1317',
        color: '#D7DFE4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99998,
        fontFamily: MONO,
        overflowY: 'auto',
      }}
    >
      <div style={{ width: 330, padding: '40px 0' }}>
        {info ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 300, letterSpacing: '0.04em', marginBottom: 18 }}>
              Investigation Desk
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.95, color: '#A8B4BC', whiteSpace: 'pre-wrap' }}>
              {terminal.intro}
              {'\n\n'}
              <span style={{ color: '#6E7C85' }}>{terminal.introFootnote}</span>
            </div>
            <button
              onClick={() => setInfo(false)}
              style={{
                marginTop: 24,
                background: 'transparent',
                border: '1px solid #2C363D',
                color: '#9AA8B1',
                padding: '8px 18px',
                fontSize: 12.5,
                cursor: 'pointer',
                fontFamily: MONO,
              }}
            >
              {S.common.back}
            </button>
          </>
        ) : (
          <>
            <div
              style={{ fontSize: 22, fontWeight: 300, letterSpacing: '0.05em', textAlign: 'center', marginBottom: 34 }}
            >
              Investigation Desk
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  background: '#1B2429',
                  border: '1px solid #2E3941',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 40 40" width="40" height="40">
                  <circle cx="20" cy="15" r="6.6" fill="none" stroke="#5F7280" strokeWidth="1.6" />
                  <path
                    d="M8.5 33c1.6-6.2 6.1-9.4 11.5-9.4S30 26.8 31.5 33"
                    fill="none"
                    stroke="#5F7280"
                    strokeWidth="1.6"
                  />
                </svg>
              </div>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 12))}
              placeholder={S.landing.namePlaceholder}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #2E3941',
                color: '#E4EBEF',
                fontSize: 14,
                padding: '8px 2px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: MONO,
                boxSizing: 'border-box',
              }}
            />

            <div
              style={{
                textAlign: 'center',
                fontSize: 11.5,
                color: '#5A6870',
                marginTop: 22,
                marginBottom: 30,
                letterSpacing: '0.03em',
                height: 16,
              }}
            >
              {terminal.setupLines[line]}
            </div>

            <div style={{ borderBottom: '1px solid #232C33' }}>
              {item(S.landing.continue, onContinue, hasSave, hasSave ? null : S.landing.noSave)}
              {item(S.common.newGame, onNew)}
              {item(S.landing.about, () => setInfo(true))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}