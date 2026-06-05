import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Eraser, Paintbrush, Radio, Users } from 'lucide-react';
import { GRID, useCrossTabStore } from './store/crossTabStore';
import { usePresence } from './hooks/usePresence';
import './playground.css';

const PALETTE = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#ffffff'];
const REACTIONS = ['🔥', '🎉', '💜', '⚡', '🚀'];

type Float = { id: number; emoji: string; x: number };

function openSecondTab() {
  window.open(window.location.href, '_blank', 'noopener');
}

function CrossTabDemo() {
  const store = useCrossTabStore();
  const tabs = usePresence('hstate-canvas-presence');
  const [color, setColor] = useState(PALETTE[0]);
  const [drawing, setDrawing] = useState(false);
  const [floats, setFloats] = useState<Float[]>([]);
  const lastPing = useRef<number | null>(null);

  // Fire a synced burst whenever the reaction ping changes (local OR remote tab).
  useEffect(() => {
    const ping = store.ping;
    if (!ping || ping.id === lastPing.current) return;
    lastPing.current = ping.id;
    setFloats((f) => [...f, { id: ping.id, emoji: ping.emoji, x: 10 + Math.random() * 80 }]);
  }, [store.ping]);

  const paintCell = (key: string) => store.paint(key, color);

  return (
    <div className="pg-shell">
      <div className="pg-head">
        <h1><span className="grad">Collaborative Pixel Canvas</span></h1>
        <p>
          A shared canvas synced live across every tab with one option —{' '}
          <code>{'{ syncTabs: true }'}</code> over <code>BroadcastChannel</code>. No server, no socket.
        </p>
      </div>

      <div className="pg-presence">
        <span className="pg-live-pill"><span className="live-dot" /> LIVE</span>
        <span className="pg-presence-dots">
          {Array.from({ length: Math.min(tabs, 8) }).map((_, i) => (
            <span key={i} className={`pg-presence-dot${i === 0 ? ' self' : ''}`} />
          ))}
        </span>
        <span className="pg-muted" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Users size={15} /> {tabs} {tabs === 1 ? 'tab' : 'tabs'} connected
        </span>
        <button type="button" className="pg-btn primary" onClick={openSecondTab}>
          <ExternalLink size={15} /> Open another tab
        </button>
      </div>

      <div className="pg-grid two">
        <div className="pg-card pg-reactions">
          <div className="pg-card-head">
            <h2 className="pg-icon-head"><Paintbrush size={18} /> Canvas</h2>
            <button type="button" className="pg-btn danger" onClick={store.clear}>
              <Eraser size={15} /> clear
            </button>
          </div>

          <div className="pg-canvas-wrap">
            <div
              className="pg-canvas"
              style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, width: 'min(100%, 380px)' }}
              onPointerUp={() => setDrawing(false)}
              onPointerLeave={() => setDrawing(false)}
            >
              {Array.from({ length: GRID * GRID }).map((_, i) => {
                const key = `${Math.floor(i / GRID)}-${i % GRID}`;
                const fill = store.pixels[key];
                return (
                  <button
                    type="button"
                    key={key}
                    className={`pg-cell${fill ? ' filled' : ''}`}
                    style={fill ? { background: fill, boxShadow: `0 0 8px ${fill}66` } : undefined}
                    onPointerDown={() => { setDrawing(true); paintCell(key); }}
                    onPointerEnter={() => { if (drawing) paintCell(key); }}
                    aria-label={`pixel ${key}`}
                  />
                );
              })}
            </div>

            <div className="pg-swatches">
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`pg-swatch${c === color ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>

            <div className="pg-row" style={{ justifyContent: 'center' }}>
              {REACTIONS.map((emoji) => (
                <button type="button" key={emoji} className="pg-btn" onClick={() => store.react(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {floats.map((f) => (
            <span
              key={f.id}
              className="pg-reaction-float"
              style={{ left: `${f.x}%` }}
              onAnimationEnd={() => setFloats((arr) => arr.filter((x) => x.id !== f.id))}
            >
              {f.emoji}
            </span>
          ))}
        </div>

        <div>
          <div className="pg-stat-row" style={{ marginBottom: '1rem' }}>
            <div className="pg-stat"><div className="n">{tabs}</div><div className="l">tabs live</div></div>
            <div className="pg-stat"><div className="n">{Object.keys(store.pixels).length}</div><div className="l">pixels</div></div>
            <div className="pg-stat"><div className="n">{store.strokes}</div><div className="l">strokes</div></div>
          </div>

          <div className="pg-callout" style={{ margin: '0 0 1rem' }}>
            <Radio size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Try it:</strong> open a second tab side-by-side and paint — every stroke and
              reaction appears in both instantly. Close a tab and the presence count drops.
            </span>
          </div>

          <div className="pg-card pg-code">
            <pre>
              {`// Shared canvas — synced across tabs
const { useStore, store } = createStore(
  { pixels: {}, strokes: 0, ping: null },
  {
    paint: (s) => (key, color) => {
      s.pixels = { ...s.pixels, [key]: color };
      s.strokes++;
    },
    react: (s) => (emoji) => {
      s.ping = { id: Date.now(), emoji };
    },
  },
  { enabled: true, key: 'canvas' }, // persist
  { syncTabs: true },               // 👈 live in every tab
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrossTabDemo;
