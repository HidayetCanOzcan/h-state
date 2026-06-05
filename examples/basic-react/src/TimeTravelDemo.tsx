import { Undo2, Redo2, Trash2, Plus, X, FileText } from 'lucide-react';
import { useTimeTravelStore } from './store/timeTravelStore';
import './playground.css';

function TimeTravelDemo() {
  const store = useTimeTravelStore();
  const { canUndo, canRedo, past, future } = store.$history();

  return (
    <div className="pg-shell">
      <div className="pg-head">
        <h1>
          <span className="grad">Time Travel</span>
        </h1>
        <p>
          Undo / redo in <strong>one line</strong>. Enable with{' '}
          <code>{'{ history: true }'}</code> — works for primitives, objects, and arrays.
        </p>
      </div>

      <div className="pg-grid two">
        <div className="pg-card">
          <div className="pg-card-head">
            <h2 className="pg-icon-head"><FileText size={18} /> Document editor</h2>
            <span className="pg-badge">{past} undo · {future} redo</span>
          </div>

          <div className="pg-timeline">
            {Array.from({ length: past }).map((_, i) => (
              <span key={`p${i}`} className="pg-tl-node past" />
            ))}
            <span className="pg-tl-node now" />
            {Array.from({ length: future }).map((_, i) => (
              <span key={`f${i}`} className="pg-tl-node future" />
            ))}
            {past === 0 && future === 0 && <span className="pg-muted" style={{ margin: 0 }}>edit below to build history →</span>}
          </div>

          <div className="pg-btns">
            <button type="button" className="pg-btn primary" disabled={!canUndo} onClick={store.$undo}>
              <Undo2 size={15} /> Undo
            </button>
            <button type="button" className="pg-btn" disabled={!canRedo} onClick={store.$redo}>
              <Redo2 size={15} /> Redo
            </button>
            <button type="button" className="pg-btn danger" onClick={store.$clearHistory}>
              <Trash2 size={15} /> clear history
            </button>
          </div>

          <div className="pg-field">
            <label htmlFor="tt-title">Title</label>
            <input
              id="tt-title"
              className="pg-input"
              value={store.title}
              onChange={(e) => store.setTitle(e.target.value)}
            />
          </div>

          <div className="pg-field">
            <label htmlFor="tt-color">Accent color</label>
            <div className="pg-row">
              <input
                id="tt-color"
                type="color"
                value={store.color}
                onChange={(e) => store.setColor(e.target.value)}
                style={{ width: 48, height: 40, background: 'transparent', border: 'none', cursor: 'pointer' }}
              />
              <span
                className="pg-badge"
                style={{ background: store.color, color: '#0a0a0f' }}
              >
                {store.color}
              </span>
            </div>
          </div>

          <div className="pg-field">
            <label htmlFor="tt-draft">Add note</label>
            <div className="pg-row">
              <input
                id="tt-draft"
                className="pg-input"
                value={store.draft}
                placeholder="Type and add…"
                onChange={(e) => store.setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && store.addItem()}
              />
              <button type="button" className="pg-btn primary" onClick={store.addItem}><Plus size={15} /> add</button>
            </div>
          </div>

          <div className="pg-list" style={{ marginTop: '0.75rem' }}>
            {store.items.map((item, index) => (
              <div key={`${item}-${index}`} className="pg-item">
                <span className="pg-text" style={{ borderLeft: `3px solid ${store.color}`, paddingLeft: '0.6rem' }}>
                  {item}
                </span>
                <button type="button" className="pg-btn danger icon" onClick={() => store.removeAt(index)} aria-label="remove">
                  <X size={15} />
                </button>
              </div>
            ))}
            {store.items.length === 0 && <p className="pg-empty">No notes — add one, then undo.</p>}
          </div>
        </div>

        <div className="pg-card pg-code">
          <pre>
            {`// Enable time travel — 4th arg
const { useStore, store } = createStore(
  initial, methods,
  undefined,            // persistOptions
  { history: true },    // 👈 undo/redo
);

// Anywhere:
store.$undo();   // step back
store.$redo();   // step forward
store.$history(); // { canUndo, canRedo, past, future }
store.$clearHistory();

// In React:
const { canUndo, canRedo } = useStore().$history();`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default TimeTravelDemo;
