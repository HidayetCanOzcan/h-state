import { useEffect, useState } from 'react';
import { useSubStore, subStore } from './store/subscriptionStore';
import './playground.css';

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
    <div className="pg-shell">
      <div className="pg-head">
        <h1>
          <span className="grad">Vanilla Subscriptions</span>
        </h1>
        <p>
          Use the store <strong>outside React</strong> via <code>$subscribe</code>,{' '}
          <code>$subscribeWithSelector</code> and <code>$getState</code>.
        </p>
      </div>

      <div className="pg-grid two">
        <div className="pg-card">
          <div className="pg-card-head">
            <h2>🎛️ Mutate the store</h2>
          </div>
          <div className="pg-counter">
            <button type="button" onClick={store.decrement} className="pg-btn">−</button>
            <span className="val">{store.count}</span>
            <button type="button" onClick={store.increment} className="pg-btn primary">+</button>
          </div>
          <div className="pg-field">
            <label htmlFor="sub-name">Name</label>
            <input
              id="sub-name"
              className="pg-input"
              type="text"
              value={store.user.name}
              onChange={(e) => store.setName(e.target.value)}
            />
          </div>

          <div className="pg-code" style={{ marginTop: '1.1rem' }}>
            <pre>{`const { useStore, store } = createStore(/* … */);

store.$subscribe((next, prev) => { /* any change */ });
store.$subscribeWithSelector(
  (s) => s.user.name,
  (name) => { /* only when name changes */ }
);
store.$getState(); // plain deep snapshot`}</pre>
          </div>
        </div>

        <div className="pg-card">
          <div className="pg-card-head">
            <h2>📡 External log</h2>
          </div>
          <p className="pg-muted">
            Counter changes fire <code>$subscribe</code> only; name changes fire both.
          </p>
          <div className="pg-log">
            {log.length === 0 && <p className="pg-empty">Interact to see events…</p>}
            {log.map((entry) => (
              <div
                key={entry.id}
                className="pg-log-line"
                style={{ color: entry.kind === 'selector' ? '#34d399' : '#a5b4fc' }}
              >
                {entry.text}
              </div>
            ))}
          </div>

          <div className="pg-code" style={{ marginTop: '1.1rem' }}>
            <pre>{`// $getState() — live plain snapshot
${snapshot}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionsDemo;
