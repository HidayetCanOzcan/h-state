import { useRef } from 'react';
import { ListChecks, Plus, Trash2, AlertTriangle, ArrowDownUp, ArrowUpDown } from 'lucide-react';
import { useArrayStore } from './store/arrayStore';
import './playground.css';

function ArrayReactivityDemo() {
  const store = useArrayStore();

  // Proves the component actually re-renders on every tracked array mutation.
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="pg-shell">
      <div className="pg-head">
        <h1>
          <span className="grad">Array Reactivity</span>
        </h1>
        <p>
          Proxy-free. Mutating methods re-render automatically while{' '}
          <code>Array.isArray</code> stays <code>true</code>.
        </p>
      </div>

      <div className="pg-grid two">
        <div className="pg-card">
          <div className="pg-card-head">
            <h2 className="pg-icon-head"><ListChecks size={18} /> Live list · {store.items.length} items</h2>
            <span className="pg-badge">render #{renderCount.current}</span>
          </div>

          <div className="pg-row">
            <input
              className="pg-input"
              type="text"
              value={store.draft}
              onChange={(e) => store.setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && store.add()}
              placeholder="New item, then push()…"
            />
            <button type="button" onClick={store.add} className="pg-btn primary">
              <Plus size={15} /> push()
            </button>
          </div>

          <div className="pg-btns">
            <button type="button" onClick={store.pushTwoBatched} className="pg-btn">push ×2 (batched)</button>
            <button type="button" onClick={store.unshiftSample} className="pg-btn">unshift()</button>
            <button type="button" onClick={store.pop} className="pg-btn">pop()</button>
            <button type="button" onClick={store.shift} className="pg-btn">shift()</button>
            <button type="button" onClick={store.sortAsc} className="pg-btn"><ArrowDownUp size={14} /> sort()</button>
            <button type="button" onClick={store.reverse} className="pg-btn"><ArrowUpDown size={14} /> reverse()</button>
            <button type="button" onClick={store.reset} className="pg-btn danger"><Trash2 size={14} /> reset</button>
          </div>

          <div className="pg-list">
            {store.items.map((item, index) => (
              <div key={item.id} className="pg-item">
                <input
                  type="checkbox"
                  aria-label={`toggle ${item.text}`}
                  checked={item.done}
                  onChange={() => store.toggleAt(index)}
                />
                <input
                  aria-label={`edit ${item.text}`}
                  className={`pg-text${item.done ? ' done' : ''}`}
                  value={item.text}
                  onChange={(e) => store.editAt(index, e.target.value)}
                />
                <button type="button" onClick={() => store.removeAt(index)} className="pg-btn danger icon" aria-label="splice">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {store.items.length === 0 && (
              <p className="pg-empty">List is empty — push() or unshift() to add items.</p>
            )}
          </div>

          <div className="pg-note">
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} /> Proxy-free limitation:</strong> direct index assignment{' '}
            <code>items[0] = x</code> is NOT tracked — the data changes but the UI won’t update
            until the next tracked change.
            <div style={{ marginTop: '0.7rem' }}>
              <button type="button" onClick={store.untrackedIndexSet} className="pg-btn">
                items[0] = … (no re-render)
              </button>
            </div>
          </div>
        </div>

        <div className="pg-card pg-code">
          <pre>
            {`// Mutating methods are tracked — no clone needed
store.items.push(item);     // ✅ re-render + persist
store.items.splice(i, 1);   // ✅
store.items.sort(cmp);      // ✅
store.items[i].done = true; // ✅ nested element wrapped

// Not tracked (use splice / reassign instead)
store.items[0] = item;      // ❌
store.items.length = 0;     // ❌`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ArrayReactivityDemo;
