import { useEffect, useState } from 'react';
import { useSubStore, subStore } from './store/subscriptionStore';
import './styles.css';

type LogEntry = { id: number; kind: 'any' | 'selector'; text: string };

function SubscriptionsDemo() {
  // React view — re-renders via the hook as usual.
  const store = useSubStore();

  // External ($subscribe / $subscribeWithSelector) events are collected here
  // to PROVE the store can drive non-React logic. We only use React state to
  // render the captured log; the subscriptions themselves live outside render.
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    let id = 0;
    const push = (kind: LogEntry['kind'], text: string) =>
      setLog((prev) => [{ id: id++, kind, text }, ...prev].slice(0, 8));

    const unsubAny = subStore.$subscribe((next, prev) => {
      push('any', `$subscribe → count ${prev.count}→${next.count}, name "${next.user.name}"`);
    });
    const unsubName = subStore.$subscribeWithSelector(
      (s) => s.user.name,
      (name, prevName) => push('selector', `$subscribeWithSelector(name) → "${prevName}"→"${name}"`),
    );

    return () => {
      unsubAny();
      unsubName();
    };
  }, []);

  const snapshot = JSON.stringify(store.$getState(), null, 2);

  return (
    <div className="main-container">
      <div className="content-wrapper">
        <div className="title-container">
          <h1 className="main-title">h-state · Vanilla Subscriptions</h1>
          <p className="subtitle">
            Use the store <strong>outside React</strong> via{' '}
            <code>$subscribe</code>, <code>$subscribeWithSelector</code> and <code>$getState</code>.
          </p>
        </div>

        <div className="example-container">
          <section className="example-section">
            <h2 className="section-title">🎛️ Mutate the store</h2>
            <div className="counter-container">
              <button type="button" onClick={store.decrement} className="btn-decrement">
                -
              </button>
              <span className="counter-value">Count: {store.count}</span>
              <button type="button" onClick={store.increment} className="btn-increment">
                +
              </button>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Name: </label>
              <input
                type="text"
                value={store.user.name}
                onChange={(e) => store.setName(e.target.value)}
                className="form-input"
              />
            </div>
          </section>

          <div className="code-block">
            <pre>{`const { useStore, store } = createStore(/* … */);

store.$subscribe((next, prev) => { /* any change */ });
store.$subscribeWithSelector(
  (s) => s.user.name,
  (name) => { /* only when name changes */ }
);
store.$getState(); // plain deep snapshot`}</pre>
          </div>
        </div>

        <div className="example-container">
          <section className="example-section">
            <h2 className="section-title">📡 External subscription log</h2>
            <p className="section-description">
              Counter changes fire <code>$subscribe</code> only; name changes fire both.
            </p>
            <div className="todo-list">
              {log.length === 0 && <p className="help-text">Interact above to see events…</p>}
              {log.map((entry) => (
                <div key={entry.id} className="todo-item">
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      color: entry.kind === 'selector' ? '#34d399' : '#a5b4fc',
                    }}
                  >
                    {entry.text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="code-block">
            <pre>{`// $getState() — live plain snapshot
${snapshot}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionsDemo;
