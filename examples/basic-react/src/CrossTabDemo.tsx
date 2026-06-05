import { useCrossTabStore } from './store/crossTabStore';
import './playground.css';

function openSecondTab() {
  window.open(window.location.href, '_blank', 'noopener');
}

function CrossTabDemo() {
  const store = useCrossTabStore();

  return (
    <div className="pg-shell">
      <div className="pg-head">
        <h1>
          <span className="grad">Cross-Tab Sync</span>
        </h1>
        <p>
          One option <code>{'{ syncTabs: true }'}</code> keeps state live across every tab via{' '}
          <code>BroadcastChannel</code> — no server.
        </p>
      </div>

      <div className="pg-callout">
        <strong>Try it:</strong> open this page in a second tab, then change anything here — it
        updates there instantly (and vice-versa).
        <button type="button" className="pg-btn primary" onClick={openSecondTab} style={{ marginLeft: '0.75rem' }}>
          ↗ Open a second tab
        </button>
      </div>

      <div className="pg-grid two">
        <div className="pg-card">
          <div className="pg-card-head">
            <h2>🎛️ Shared state</h2>
          </div>

          <div className="pg-counter">
            <button type="button" className="pg-btn" onClick={store.decrement}>−</button>
            <span className="val" style={{ color: store.color }}>{store.count}</span>
            <button type="button" className="pg-btn primary" onClick={store.increment}>+</button>
          </div>

          <div className="pg-field">
            <label htmlFor="ct-color">Accent color (syncs too)</label>
            <div className="pg-row">
              <input
                id="ct-color"
                type="color"
                value={store.color}
                onChange={(e) => store.setColor(e.target.value)}
                style={{ width: 48, height: 40, background: 'transparent', border: 'none', cursor: 'pointer' }}
              />
              <span className="pg-badge" style={{ background: store.color, color: '#0a0a0f' }}>
                {store.color}
              </span>
            </div>
          </div>

          <div className="pg-field">
            <label htmlFor="ct-draft">Broadcast a message</label>
            <div className="pg-row">
              <input
                id="ct-draft"
                className="pg-input"
                value={store.draft}
                placeholder="Type, then send…"
                onChange={(e) => store.setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && store.send()}
              />
              <button type="button" className="pg-btn primary" onClick={store.send}>send</button>
            </div>
          </div>

          <button type="button" className="pg-btn danger" onClick={store.reset} style={{ marginTop: '0.75rem' }}>
            reset
          </button>

          <div className="pg-list" style={{ marginTop: '0.75rem' }}>
            {store.messages.map((msg, index) => (
              <div key={`${msg}-${index}`} className="pg-item">
                <span className="pg-text" style={{ borderLeft: `3px solid ${store.color}`, paddingLeft: '0.6rem' }}>
                  {msg}
                </span>
              </div>
            ))}
            {store.messages.length === 0 && <p className="pg-empty">No messages yet — send one and watch the other tab.</p>}
          </div>
        </div>

        <div className="pg-card pg-code">
          <pre>
            {`// Enable cross-tab sync — 4th arg
const { useStore, store } = createStore(
  initial, methods,
  { enabled: true, key: 'app' }, // persist (optional)
  { syncTabs: true },            // 👈 sync across tabs
);

// Any mutation propagates to every open tab:
store.increment();
store.messages.push('hi other tab!');

// Stop syncing (e.g. on unmount):
store.$destroy();`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default CrossTabDemo;
