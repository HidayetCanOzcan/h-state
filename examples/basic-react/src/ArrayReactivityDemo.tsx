import { useRef } from 'react';
import { useArrayStore } from './store/arrayStore';
import './styles.css';

function ArrayReactivityDemo() {
  const store = useArrayStore();

  // Proves the component actually re-renders on every tracked array mutation.
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="main-container">
      <div className="content-wrapper">
        <div className="title-container">
          <h1 className="main-title">h-state · Array Reactivity</h1>
          <p className="subtitle">
            Proxy-free reactivity. Mutating methods re-render automatically while{' '}
            <code>Array.isArray</code> stays <code>true</code>.
          </p>
        </div>

        <div className="example-container">
          <section className="example-section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <h2 className="section-title">📝 Live List ({store.items.length} items)</h2>
              <span
                style={{
                  fontFamily: 'monospace',
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                }}
              >
                render #{renderCount.current}
              </span>
            </div>

            <div className="todo-form">
              <input
                type="text"
                value={store.draft}
                onChange={(e) => store.setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && store.add()}
                placeholder="New item, then push()…"
                className="todo-input"
              />
              <button type="button" onClick={store.add} className="add-button">
                push()
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                margin: '0.75rem 0 1rem',
              }}
            >
              <button type="button" onClick={store.pushTwoBatched} className="btn-increment">
                push ×2 (batched)
              </button>
              <button type="button" onClick={store.unshiftSample} className="btn-increment">
                unshift()
              </button>
              <button type="button" onClick={store.pop} className="btn-decrement">
                pop()
              </button>
              <button type="button" onClick={store.shift} className="btn-decrement">
                shift()
              </button>
              <button type="button" onClick={store.sortAsc} className="btn-increment">
                sort()
              </button>
              <button type="button" onClick={store.reverse} className="btn-increment">
                reverse()
              </button>
              <button type="button" onClick={store.reset} className="clear-persist-btn">
                reset
              </button>
            </div>

            <div className="todo-list">
              {store.items.map((item, index) => (
                <div key={item.id} className="todo-item">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => store.toggleAt(index)}
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => store.editAt(index, e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        textDecoration: item.done ? 'line-through' : 'none',
                        opacity: item.done ? 0.55 : 1,
                        fontSize: '1rem',
                      }}
                    />
                  </label>
                  <button type="button" onClick={() => store.removeAt(index)} className="todo-delete-btn">
                    splice
                  </button>
                </div>
              ))}
              {store.items.length === 0 && (
                <p className="help-text">List is empty — push() or unshift() to add items.</p>
              )}
            </div>
          </section>

          <div className="alert-box warning" style={{ marginTop: '1rem' }}>
            <strong>⚠️ Proxy-free limitation:</strong> direct index assignment{' '}
            <code>items[0] = x</code> is NOT tracked. The button below mutates the data but the UI
            will NOT update until the next tracked change.
            <div style={{ marginTop: '0.75rem' }}>
              <button type="button" onClick={store.untrackedIndexSet} className="btn-decrement">
                items[0] = … (no re-render)
              </button>
            </div>
          </div>
        </div>

        <div className="example-container">
          <div className="code-block">
            <pre>
              {`// Mutating methods are tracked — no clone needed
store.items.push(item);     // ✅ re-render + persist
store.items.splice(i, 1);   // ✅
store.items.sort(cmp);      // ✅
store.items[i].done = true; // ✅ nested element wrapped eagerly

// Not tracked (use splice / reassign instead)
store.items[0] = item;      // ❌
store.items.length = 0;     // ❌`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArrayReactivityDemo;
